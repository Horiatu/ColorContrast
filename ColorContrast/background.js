console.log('Background loading');

var Background = Background || {};

// Converts an RGB color into a hex color
Background.convertRGBToHex = function(rgb)
{
  var blue  = parseInt(rgb[2], 10).toString(16).toLowerCase();
  var green = parseInt(rgb[1], 10).toString(16).toLowerCase();
  var red   = parseInt(rgb[0], 10).toString(16).toLowerCase();

  // If the color is only 1 character
  if(blue.length == 1)
  {
    blue = "0" + blue;
  }

  // If the color is only 1 character
  if(green.length == 1)
  {
    green = "0" + green;
  }

  // If the color is only 1 character
  if(red.length == 1)
  {
    red = "0" + red;
  }

  return "#" + red + green + blue;
};

$.getContext = function() {

  var deferred = $.Deferred();

  chrome.tabs.captureVisibleTab(null, function(dataUrl)
  {
    Background.image = new Image();

    Background.image.onload = function()
    {
      var canvas  = document.createElement("canvas");
      Background.context = canvas.getContext("2d");

      canvas.height = Background.image.naturalHeight;
      canvas.width  = Background.image.naturalWidth;

      Background.context.clearRect(0, 0, Background.image.naturalWidth, Background.image.naturalHeight);
      Background.context.drawImage(Background.image, 0, 0);

      deferred.resolve();
    };

    Background.image.onerror = function() {
      deferred.reject();
    };

    Background.image.src = dataUrl;

  });

  return deferred.promise();
}

Background.context = null;
Background.image = null;
Background.promise = null; 

// Gets the current color
Background.getColor = function(x, y, eventType)
{
  if(!Background.context || eventType=='selected')
  {
    Background.promise = $.getContext();
  }

  Background.promise.then(
    function() {
      var deep=5;
      var color = Background.convertRGBToHex(Background.context.getImageData(x, y, 1, 1).data);
      
      var colors = "";
      var cr ='[';
      for (i=-deep; i<=deep; i++) {
        xi = x+i;
        var cc = cr+"[";
        for (j=-deep; j<=deep; j++) {
          yj = y+j;
          if(xi<0 || xi>=Background.image.naturalWidth || yj<0 || yj>=Background.image.naturalHeight)
          {
            colors+=cc + 'null';
          }
          else {
            colors+=cc + "'"+Background.convertRGBToHex(Background.context.getImageData(xi, yj, 1, 1).data)+"'";
          }
          cc = ',';
        }
        colors+="]";
        cr=',';
      }
      colors+="]";
      //console.log(colors);
      try {
        chrome.tabs.executeScript(null, { "code": "ColorPicker.setColor('" + color + "', '" + eventType + "')" });
        chrome.tabs.executeScript(null, { "code": "ColorPicker.setColors(" + colors + ", '" + eventType + "')" });
      }
      catch(err) {
        //console.log(err);
      }
    }
  );

  return {};
};

// Returns the edit CSS dashboard HTML template
Background.getEditCSSDashboardTemplates = function(parameters)
{
  return { "dashboard": ich.dashboard(parameters, true), "editCSS": ich.editCSSPanel(parameters, true), "panel": ich.dashboardPanel(parameters, true), "tab": ich.dashboardTab(parameters, true) };
};

// Returns the edit CSS tab HTML template
Background.getEditCSSTabTemplates = function(parameters)
{
  return { "panel": ich.editCSSTabPanel(parameters, true), "tab": ich.editCSSTab(parameters, true) };
};

// Returns the element information dashboard HTML template
Background.getElementInformationDashboardTemplates = function(parameters)
{
  return { "dashboard": ich.dashboard(parameters, true), "elementInformation": ich.elementInformationPanel(parameters, true), "panel": ich.dashboardPanel(parameters, true), "tab": ich.dashboardTab(parameters, true) };
};

// Gets the styles from CSS
Background.getStylesFromCSS = function(cssDocuments)
{
  var contentDocument = null;
  var cssContent      = null;
  var styles          = "";
  var documents       = cssDocuments.documents;
  var styleSheets     = [];

  // Loop through the documents
  for(var i = 0, l = documents.length; i < l; i++)
  {
    contentDocument = documents[i];
    styleSheets     = styleSheets.concat(contentDocument.styleSheets);

    // If there are embedded styles
    if(contentDocument.embedded)
    {
      styles += contentDocument.embedded;
    }
  }

  cssContent = Background.getURLContents(styleSheets, "");

  // Loop through the CSS content
  for(i = 0, l = cssContent.length; i < l; i++)
  {
    styles += cssContent[i].content;
  }

  return { "css": styles };
};

// Gets the content from a URL
Background.getURLContent = function(url, errorMessage)
{
  var content = null;

  // Try to get the content
  try
  {
    var request = new XMLHttpRequest();

    // Chrome no longer allows a timeout set on synchronous requests
    //request.timeout = Common.requestTimeout;

    request.ontimeout = function()
    {
      content = errorMessage;
    };

    request.open("get", url, false);
    request.send(null);

    content = request.responseText;
  }
  catch(exception)
  {
    content = errorMessage;
  }

  return content;
};

// Gets the content from a set of URLs
Background.getURLContents = function(urls, errorMessage)
{
  var url         = null;
  var urlContents = [];

  // Loop through the urls
  for(var i = 0, l = urls.length; i < l; i++)
  {
    url = urls[i];

    urlContents.push({ "content": Background.getURLContent(url, errorMessage), "url": url });
  }

  return urlContents;
};

// Initializes a generated tab
Background.initializeGeneratedTab = function(url, data, locale)
{
  var extensionTab = null;
  var tabs         = chrome.extension.getViews({ "type": "tab" });

  // Loop through the tabs
  for(var i = 0, l = tabs.length; i < l; i++)
  {
    extensionTab = tabs[i];

    // If the tab has a matching URL and has not been initialized
    if(extensionTab.location.href == url && !extensionTab.Generated.initialized)
    {
      extensionTab.Generated.initialized = true;

      extensionTab.Generated.initialize(data, locale);
    }
  }
};

// Initializes a validation tab
Background.initializeValidationTab = function(url, data)
{
  var extensionTab = null;
  var tabs         = chrome.extension.getViews({ "type": "tab" });

  // Loop through the tabs
  for(var i = 0, l = tabs.length; i < l; i++)
  {
    extensionTab = tabs[i];

    // If the tab has a matching URL and has not been initialized
    if(extensionTab.location.href == url && !extensionTab.Validation.initialized)
    {
      extensionTab.Validation.initialized = true;

      extensionTab.Validation.initialize(data);
    }
  }
};

// Handles any background messages
Background.message = function(msg, sender, sendResponse)
{
  // If the msg type is to get the current color
  if(msg.type == "get-color")
  {
    sendResponse(Background.getColor(msg.x, msg.y, msg.eventType));
  }
  else if(msg.type == "get-canvas")
  {
    Background.context = null;
  }
};

chrome.extension.onMessage.addListener(Background.message);

/* / Opens a generated tab
Background.openGeneratedTab = function(tabURL, tabIndex, data, locale)
{
  chrome.tabs.create({ "index": tabIndex + 1, "url": tabURL }, function(openedTab)
  {
    var tabLoaded = function(tabId, tabInformation)
    {
      // If this is the opened tab and it finished loading
      if(tabId == openedTab.id && tabInformation.status == "complete")
      {
        Background.initializeGeneratedTab(tabURL, data, locale);

        chrome.tabs.onUpdated.removeListener(tabLoaded);
      }
    };

    chrome.tabs.onUpdated.addListener(tabLoaded);
  });
};
/*
// Validates the CSS of the local page
Background.validateLocalCSS = function(tabURL, tabIndex, css)
{
  chrome.tabs.create({ "index": tabIndex + 1, "url": tabURL }, function(openedTab)
  {
    var tabLoaded = function(tabId, tabInformation)
    {
      // If this is the opened tab and it finished loading
      if(tabId == openedTab.id && tabInformation.status == "complete")
      {
        Background.initializeValidationTab(tabURL, Background.getStylesFromCSS(css));

        chrome.tabs.onUpdated.removeListener(tabLoaded);
      }
    };

    chrome.tabs.onUpdated.addListener(tabLoaded);
  });
};

// Validates the HTML of the local page
Background.validateLocalHTML = function(tabURL, tabIndex, validateURL)
{
  chrome.tabs.create({ "index": tabIndex + 1, "url": tabURL }, function(openedTab)
  {
    var tabLoaded = function(tabId, tabInformation)
    {
      // If this is the opened tab and it finished loading
      if(tabId == openedTab.id && tabInformation.status == "complete")
      {
        Background.initializeValidationTab(tabURL, Background.getURLContents([validateURL], ""));

        chrome.tabs.onUpdated.removeListener(tabLoaded);
      }
    };

    chrome.tabs.onUpdated.addListener(tabLoaded);
  });
};
*/
