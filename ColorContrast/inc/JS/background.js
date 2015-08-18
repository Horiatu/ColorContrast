var Background = Background || {};

Background.Color = null;
Background.BackgroundColor = null;
Background.RequestColor = null;

Background.capture = function() {
    try {
        chrome.tabs.captureVisibleTab(null, {
            format: 'png'
        }, Background.doCapture);
        // fallback for chrome before 5.0.372.0
    } catch (e) {
        chrome.tabs.captureVisibleTab(null, Background.doCapture);
    }
};

Background.doCapture = function(data) {
    if (data) {
        Background.sendMessage({
            type: 'update-image',
            data: data
        }, function() {});
    } else {
        msg = 'Did not receive data from captureVisibleTab.';
        Background.sendMessage({
            type: 'error',
            msg: msg
        }, function() {});
        //console.error(msg);
    }
};

Background.sendMessage = function(message, callback) {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendMessage(tab.id, message, callback);
    });
};

Background.getOptionOrDefault = function(a, option, value) {
    if(a[option] == undefined) {
        a[option] = value;
    }
    return a[option];
};

Background.getDefaults = function() {
    var gdDfr = $.Deferred();
    chrome.storage.sync.get(['magnifierGlass', 'MapBg', 'clickType', 'autoCopy', 'toolbar', 'sample', 'position', 'gridSize', 'eyeType'],
    function(a) {
        defaults = {
            type:'defaults',
            magnifierGlass : Background.getOptionOrDefault(a, 'magnifierGlass', 'magnifierGlass3'),
            MapBg : Background.getOptionOrDefault(a, 'MapBg', true), 
            clickType : Background.getOptionOrDefault(a, 'clickType', true), 
            autoCopy : Background.getOptionOrDefault(a, 'autoCopy', true), 
            toolbar : Background.getOptionOrDefault(a, 'toolbar', true), 
            sample : Background.getOptionOrDefault(a, 'sample', true), 
            position : Background.getOptionOrDefault(a, 'position', {up:true, left:true}), 
            gridSize : Background.getOptionOrDefault(a, 'gridSize', 13),
            eyeType : Background.getOptionOrDefault(a, 'eyeType', 'NormalVision')
        };
        gdDfr.resolve(defaults);
    });
    return gdDfr.promise();
};

chrome.extension.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(req) {
        switch (req.type) {
            case 'screenshot':
                Background.capture();
                break;
            case 'set-color':
                Background.Color = req.color;
                if(req.reqColor === 'foreground')
                    Background.Color = req.color;
                else
                    Background.BackgroundColor = req.color;
                break;
            case 'set-colors':
                Background.Color = req.color;
                Background.BackgroundColor = req.bgcolor;
                break;
            case 'get-colors':
                Background.sendMessage({
                  type: req.type,
                  color: Background.Color,
                  bgcolor: Background.BackgroundColor,
                  reqcolor: Background.RequestColor,
                  reqColor: req.color
                });
                break;
            case 'get-defaults':
                Background.getDefaults().done(function(defaults) {
                    Background.sendMessage(defaults);
                    //console.log(defaults);
                });
                break;
        }
    });
});

chrome.tabs.getSelected(null, function(tab) {
    chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
        switch (msg.type) {
            case 'get-contrast':
                sendResponse({contrast: ContrastAnalyser.contrast(msg.c1, msg.c2)});
                break;
            case 'fix-contrast':
                sendResponse(Background.fixContrast(msg.c1, msg.c2));
                break;
        }
    });
});

Background.fixContrast = function(color1, color2) {
    var contrast0 = ContrastAnalyser.contrast(color1, color2);
    c1rgb = ContrastAnalyser.rgb(color1);
    c1rgb.r = c1rgb.r + 1;
    colorR = ContrastAnalyser.rgbToHex(c1rgb);
    var contrastR = ContrastAnalyser.contrast(colorR, color2);
    return {color1: color1, color2:color2, contrast: contrast0, fixR: { color: colorR, contrast: contrastR}};
};
