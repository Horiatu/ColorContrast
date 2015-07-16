var Background = Background || {};

// Converts an RGB color into a hex color
Background.convertRGBToHex = function(rgb) {
    var blue = parseInt(rgb[2], 10).toString(16).toLowerCase();
    var green = parseInt(rgb[1], 10).toString(16).toLowerCase();
    var red = parseInt(rgb[0], 10).toString(16).toLowerCase();

    // If the color is only 1 character
    if (blue.length == 1) {
        blue = "0" + blue;
    }

    // If the color is only 1 character
    if (green.length == 1) {
        green = "0" + green;
    }

    // If the color is only 1 character
    if (red.length == 1) {
        red = "0" + red;
    }

    return "#" + red + green + blue;
};

Background.capture = function() {
    ////console.log('capturing');
    try {
      chrome.tabs.captureVisibleTab(null, {format: 'png'}, Background.doCapture);
    // fallback for chrome before 5.0.372.0
    } catch(e) {
      chrome.tabs.captureVisibleTab(null, Background.doCapture);
    }
  };

Background.doCapture = function(data) {
      if ( data ) {
        console.log('bg: sending updated image');
        Background.sendMessage({type: 'update-image', data: data}, function() {});
      } else {
        console.error('bg: did not receive data from captureVisibleTab');
      }
  };

Background.sendMessage = function(message, callback) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, message, callback);
    });
  };

$.getContext = function() {

    var deferred = $.Deferred();

    chrome.tabs.captureVisibleTab(null, function(dataUrl) {
        Background.image = new Image();

        Background.image.onload = function() {
            var canvas = document.createElement("canvas");
            Background.context = canvas.getContext("2d");

            canvas.height = Background.image.naturalHeight;
            canvas.width = Background.image.naturalWidth;

            Background.context.clearRect(0, 0, Background.image.naturalWidth, Background.image.naturalHeight);
            Background.context.drawImage(Background.image, 0, 0);

            deferred.resolve();
        };

        Background.image.onerror = function() {
            deferred.reject();
        };

        Background.image.src = dataUrl;

    });

    return deferred.promise;
}

Background.context = null;
Background.image = null;
Background.promise = null;
Background.Color = null;
Background.RequestColor = null;

// Gets the current color
Background.getColor = function(x, y, eventType, showMagnifier, showToolbar) {
    dfrGetColor = $.Deferred();

    if (!Background.context || eventType == 'selected') {
        Background.promise = $.getContext();
    }

    Background.promise().done(
        function() {
            if (!showMagnifier && !showToolbar) return;

            color = Background.convertRGBToHex(Background.context.getImageData(x, y, 1, 1).data);
            if (eventType == 'selected') {
                Background.Color = color; // !!!
            }

            colors = [];
            if (showMagnifier) {
                var deep = 3;
                for (i = -deep; i <= deep; i++) {
                    xi = x + i;
                    row = [];
                    colors.push(row);
                    for (j = -deep; j <= deep; j++) {
                        yj = y + j;
                        if (xi < 0 || xi >= Background.image.naturalWidth || yj < 0 || yj >= Background.image.naturalHeight) {
                            row.push("indigo")
                        } else {
                            row.push(Background.convertRGBToHex(Background.context.getImageData(xi, yj, 1, 1).data));
                        }
                    }
                }
            }
            dfrGetColor.resolve({x:x, y:y, eventType: eventType, color:color, colors: colors});
        }
    );
    return dfrGetColor.promise();
};

// Handles any background messages
Background.message = function(msg, sender, sendResponse) {
    // If the msg type is to get the current color
    if (msg.type == "get-color") {
        Background.getColor(msg.x, msg.y, msg.eventType, msg.showMagnifier, msg.showToolbar).done(
          function(response) {
            sendResponse(response);
          }
        );
    } else if (msg.type == "get-canvas") {
        Background.context = null;
    }
};

chrome.extension.onMessage.addListener(Background.message);

    chrome.extension.onConnect.addListener(function(port) {
      port.onMessage.addListener(function(req) {
        switch(req.type) {
          // Taking screenshot for content script
          case 'screenshot': 
            ////console.log('received screenshot request');
            Background.capture(); 
            break;
/*         
          // Creating debug tab
          case 'debug-tab':
            ////console.log('received debug tab');
            bg.debugImage = req.image;
            bg.createDebugTab();
            break;

          // Set color given in req
          case 'set-color': bg.setColor(req); break;
*/
        }
      });
    });
