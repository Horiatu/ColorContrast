console.log("ColorPicker loading");

var ColorPicker = ColorPicker || {};
ColorPicker.colorPickerToolbar = null;
ColorPicker.colorDiv = null;
ColorPicker.colorTxt = null;

// Handles the click event
ColorPicker.click = function(event)
{
  // If the click was not a right click
  if(event.button != 2)
  {
    ColorPicker.getColor(event, "selected");

    event.stopPropagation();
    event.preventDefault();
  }
};

ColorPicker.getDocumentBodyElement = function(contentDocument)
{
  // If there is a body element
  if(contentDocument.body)
  {
    return contentDocument.body;
  }
  else
  {
    var bodyElement = contentDocument.querySelector("body");

    // If there is a body element
    if(bodyElement)
    {
      return bodyElement;
    }
  }

  return contentDocument.documentElement;
};

// Creates the color picker
ColorPicker.createColorPicker = function(contentDocument)//, toolbarHTML)
{
  console.log('create ColorPicker');

  //console.log(contentDocument);

  if(!contentDocument.getElementById("colorPickerDiv")) {
    ColorPicker.colorPickerToolbar = contentDocument.createElement("Div");
    ColorPicker.colorPickerToolbar.setAttribute("id", "colorPickerDiv");
    ColorPicker.colorPickerToolbar.setAttribute("style", "position: fixed; width:100px; right: 10px; bottom:10px; background-color:white; padding:2px; border-style:inset; visibility:visible;");
    //ColorPicker.colorPickerToolbar.innerHTML = "ColorPicker";

    ColorPicker.colorDiv = contentDocument.createElement("Div");
    ColorPicker.colorDiv.setAttribute("id", "colorDiv");
    ColorPicker.colorDiv.setAttribute("style", "position: fixed; width:18px; height:18px;");
    ColorPicker.colorPickerToolbar.appendChild(ColorPicker.colorDiv);

    ColorPicker.colorTxt = contentDocument.createElement("Span");
    ColorPicker.colorTxt.setAttribute("id", "colorTxt");
    ColorPicker.colorTxt.setAttribute("style", "font-weight:bold; width:50px; margin-left:24px; margin-right:4px;");
    ColorPicker.colorPickerToolbar.appendChild(ColorPicker.colorTxt);


    ColorPicker.getDocumentBodyElement(contentDocument).appendChild(ColorPicker.colorPickerToolbar);
  }

  //ColorPicker.toolbarDocument = colorPickerToolbar.contentDocument;
  //styleSheet                                   = ColorPicker.toolbarDocument.createElement("link");
  window.ColorPickerEvents                       = window.ColorPickerEvents || {};
  window.ColorPickerEvents.ColorPicker           = window.ColorPickerEvents.ColorPicker || {};
  window.ColorPickerEvents.ColorPicker.click     = ColorPicker.click;
  window.ColorPickerEvents.ColorPicker.mouseMove = ColorPicker.mouseMove;

  //styleSheet.setAttribute("rel", "stylesheet");
  //styleSheet.setAttribute("href", Common.getChromeURL("toolbar/color-picker-toolbar.css"));
  //Common.getDocumentHeadElement(ColorPicker.toolbarDocument).appendChild(styleSheet);

  //Common.getDocumentBodyElement(ColorPicker.toolbarDocument).innerHTML = toolbarHTML;

  //ColorPicker.toolbarDocument.querySelector("img").setAttribute("src", Common.getChromeURL("toolbar/images/logo.png"));
  contentDocument.addEventListener("click", window.ColorPickerEvents.ColorPicker.click, true);
  contentDocument.addEventListener("mousemove", window.ColorPickerEvents.ColorPicker.mouseMove, false);
};

// Displays the color picker
ColorPicker.displayColorPicker = function(display, contentDocument, toolbarHTML)
{
  // If displaying the color picker
  if(display)
  {
    ColorPicker.createColorPicker(contentDocument, toolbarHTML);
  }
  else
  {
    ColorPicker.removeColorPicker(contentDocument);
  }

  //Common.toggleStyleSheet("toolbar/color-picker.css", "web-developer-color-picker-styles", contentDocument, false);
};

// Gets the color
ColorPicker.getColor = function(event, type)
{
  var eventTarget = event.target;

  // If the event target is set
  if(eventTarget)
  {
    var ownerDocument = eventTarget.ownerDocument;

    // If the owner document is set
    if(ownerDocument)
    {
      var colorPicker = ownerDocument.getElementById("color-picker-toolbar");
      var tagName     = eventTarget.tagName;

      // If the event target is not the color picker, the color picker is not an ancestor of the event target and the event target is not a scrollbar
      if(eventTarget != colorPicker && !ColorPicker.isAncestor(eventTarget, colorPicker) && tagName && tagName.toLowerCase() != "scrollbar")
      {
        chrome.extension.sendMessage({type: "get-color", x: event.clientX, y: event.clientY, eventType: type});
        //console.log(event);
      }
    }
  }
};

ColorPicker.isAncestor = function(element, ancestorElement)
{
  // If the element and ancestor element are set
  if(element && ancestorElement)
  {
    var parentElement = null;

    // Loop through the parent elements
    while((parentElement = element.parentNode) !== null)
    {
      // If the parent element is the ancestor element
      if(parentElement == ancestorElement)
      {
        return true;
      }
      else
      {
        element = parentElement;
      }
    }
  }

  return false;
};


// Handles the mouse move event
ColorPicker.mouseMove = function(event)
{
  ColorPicker.getColor(event, "hover");
};

// Removes the color picker
ColorPicker.removeColorPicker = function(contentDocument)
{
  Common.removeMatchingElements("#web-developer-color-picker-toolbar", contentDocument);

  contentDocument.removeEventListener("click", window.ColorPickerEvents.ColorPicker.click, true);
  contentDocument.removeEventListener("mousemove", window.ColorPickerEvents.ColorPicker.mouseMove, false);

  window.ColorPickerEvents.ColorPicker = null;
};

// Sets the color
ColorPicker.setColor = function(color, type)
{
  //console.log(color + "', '" + type);
  //ColorPicker.colorPickerToolbar.innerHTML = color;
  ColorPicker.colorDiv.setAttribute("style", "position:fixed; width:18px; height:18px; background-color:" + color + ";");
  ColorPicker.colorTxt.innerHTML = color;
};
