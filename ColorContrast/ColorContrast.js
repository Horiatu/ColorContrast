/*
  Color Contrast | Andrew Waer
  Origins: http://juicystudio.com/services/colourcontrast.php

  Usage:
 
  // Contrast test for two colors
  // returns passing score OR false if test fails
  Contrast.test('#ffffff', '#000000');

  // find best match from one or two color sets
  // returns array containing two hex values OR false if no match
  Contrast.match('#ffffff', ['#000000', '#336699']);
  Contrast.match(['#ffffff', '#000000', '#336699']);
  Contrast.match(['#ffffff','#ffffcc'], ['#000000', '#336699']);
*/

var ContrastAnalyser = function()
{
  // private functions and properties
  var _private =
  {
    min : { 
      'brightness': 125, 
      'difference': 500 
    },
    brightness : function(rgb1, rgb2){
      var b1 = ((rgb1.r * 299) + (rgb1.g * 587) + (rgb1.b * 114)) / 1000;
      var b2 = ((rgb2.r * 299) + (rgb2.g * 587) + (rgb2.b * 114)) / 1000;
      return Math.abs(Math.round(b1-b2));
    },
    difference : function(rgb1, rgb2){
      var diff = (Math.max(rgb1.r, rgb2.r) - Math.min(rgb1.r, rgb2.r)) + 
                 (Math.max(rgb1.g, rgb2.g) - Math.min(rgb1.g, rgb2.g)) + 
                 (Math.max(rgb1.b, rgb2.b) - Math.min(rgb1.b, rgb2.b));
      return Math.abs(Math.round(diff));
    },
    luminance : function(hex) {
      // http://www.w3.org/Graphics/Color/sRGB.html
      var rgb = _private.rgb(hex);
      var RsRGB = rgb.r/255.0;
      var GsRGB = rgb.g/255.0;
      var BsRGB = rgb.b/255.0;
      var R = RsRGB <= 0.03928 ? RsRGB/12.92 : Math.pow((RsRGB+0.055)/1.055, 2.4);
      var G = GsRGB <= 0.03928 ? GsRGB/12.92 : Math.pow((GsRGB+0.055)/1.055, 2.4);
      var B = BsRGB <= 0.03928 ? BsRGB/12.92 : Math.pow((BsRGB+0.055)/1.055, 2.4);
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    },
    rgb : function(hex){
      hex = hex.replace('#','');
      var rgb = {
        r: parseInt(hex[0] + hex[1], 16),
        g: parseInt(hex[2] + hex[3], 16),
        b: parseInt(hex[4] + hex[5], 16)
      };
      return rgb;
    },

    colourNameToHex : function (colour) {
      var colours = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
      "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
      "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
      "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
      "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
      "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
      "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
      "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
      "honeydew":"#f0fff0","hotpink":"#ff69b4",
      "indianred ":"#cd5c5c","indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
      "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
      "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
      "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
      "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
      "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
      "navajowhite":"#ffdead","navy":"#000080",
      "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
      "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
      "red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
      "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
      "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
      "violet":"#ee82ee",
      "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
      "yellow":"#ffff00","yellowgreen":"#9acd32"};

      if (typeof colours[colour.toLowerCase()] != 'undefined')
          return colours[colour.toLowerCase()];

      return false;
    },

    stringToColour : function(str) {
      var hash = 0;
      for (var i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      var colour = '#';
      for (var i = 0; i < 3; i++) {
          var value = (hash >> (i * 8)) & 0xFF;
          colour += ('00' + value.toString(16)).substr(-2);
      }
      return colour;
    },

  };
  // public functions and properties
  var _public =
  {
    colorNameOrHexToColor : function(str) {
      str = str.trim();
      h1 = str.match(/#(?:[0-9a-f]{3}){1,2}$/gi);
      if(h1 && h1.length==1) {
        h=h1[0];
        if(h.length==4) {
          return h[0]+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
        }
        return str;
      }
      else {
        return _private.colourNameToHex(str);
      }
    },
    
    contrast : function (hex1, hex2) {
      var l1 = _private.luminance(hex1) + 0.05;
      var l2 = _private.luminance(hex2) + 0.05;
      var l = l1>l2 ? l1/l2 : l2/l1;
      return l;
    },

    test : function(hex1, hex2){
      var rgb1 = _private.rgb(hex1);
      var rgb2 = _private.rgb(hex2);
      var brightness = _private.brightness(rgb1, rgb2);
      var difference = _private.difference(rgb1, rgb2);
      return (
        brightness >= _private.min.brightness && difference >= _private.min.difference
          ? ((brightness - _private.min.brightness) + (difference - _private. min.difference))
          : false
      );
    },

    testVal : function(hex1, hex2){
      var rgb1 = _private.rgb(_public.colorNameOrHexToColor(hex1));
      var rgb2 = _private.rgb(_public.colorNameOrHexToColor(hex2));
      var brightness = _private.brightness(rgb1, rgb2);
      var difference = _private.difference(rgb1, rgb2);
      var pass = brightness >= _private.min.brightness && difference >= _private.min.difference;
      return ( [pass, ((brightness - _private.min.brightness) + (difference - _private. min.difference))] );
    },

    match : function(hex1, hex2){
      var total_score, i, j;

      if (typeof hex1 == 'string') {hex1 = [hex1];}
      if (typeof hex2 == 'string') {hex2 = [hex2];}
      var best_match = { 
        score: 0,
        hex1:  null,
        hex2:  null
      };
      if (hex2 == null){
        for (i=0; i<hex1.length; i++){
          for (j=0; j<hex1.length; j++){
            total_score = _public.test(hex1[i], hex1[j]);
            if (total_score > best_match.score){
              best_match.score = total_score;
              best_match.hex1 = hex1[i];
              best_match.hex2 = hex1[j];
            }
          }
        }
      } 
      else {
        for (i=0; i<hex1.length; i++){
          for (j=0; j<hex2.length; j++){
            total_score = _public.test(hex1[i], hex2[j]);
            if (total_score > best_match.score){
              best_match.score = total_score;
              best_match.hex1 = hex1[i];
              best_match.hex2 = hex2[j];
            }
          }
        }
      }
      return (
        best_match.score > 0
        ? [ best_match.hex1, best_match.hex2 ]
        : false
      );
    }
  };
  return _public;
}();
