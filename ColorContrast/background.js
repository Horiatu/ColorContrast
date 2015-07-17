var Background = Background || {};

Background.Color = null;
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
        console.error('bg: did not receive data from captureVisibleTab');
    }
};

Background.sendMessage = function(message, callback) {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendMessage(tab.id, message, callback);
    });
};

chrome.extension.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(req) {
        switch (req.type) {
            case 'screenshot':
                Background.capture();
                break;
            case 'set-color':
                Background.Color = req.color;
                break;
        }
    });
});