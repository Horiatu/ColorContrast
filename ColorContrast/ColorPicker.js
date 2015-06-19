var ColorPicker = ColorPicker || {};
ColorPicker.colorPickerToolbar = null;
ColorPicker.colorDiv = null;
ColorPicker.colorTxt = null;

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
    ColorPicker.colorPickerToolbar.setAttribute("style", 
      "position: fixed; padding:2px; "+
      "width:100px; right: 10px; bottom:10px; "+
      "background-color:white; border-style:inset; visibility:visible;");
    
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

  window.ColorPickerEvents                       = window.ColorPickerEvents || {};
  window.ColorPickerEvents.ColorPicker           = window.ColorPickerEvents.ColorPicker || {};
  window.ColorPickerEvents.ColorPicker.click     = ColorPicker.click;
  window.ColorPickerEvents.ColorPicker.mouseMove = ColorPicker.mouseMove;

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
    try { ColorPicker.removeColorPicker(contentDocument); } catch(err) {};
  }

  //Common.toggleStyleSheet("toolbar/color-picker.css", "web-developer-color-picker-styles", contentDocument, false);
};

ColorPicker.refresh = function() 
{
  chrome.extension.sendMessage({type: "get-canvas"});
}

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
      var colorPicker = ownerDocument.getElementById("colorPickerDiv");
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


// Handles the click event
ColorPicker.click = function(event)
{
  if(event.button != 2)
  {
    ColorPicker.getColor(event, "selected");

    event.stopPropagation();
    event.preventDefault();
  }
};

// Handles the mouse move event
ColorPicker.mouseMove = function(event)
{
  ColorPicker.getColor(event, "hover");
};

// Removes the color picker
ColorPicker.removeColorPicker = function(contentDocument)
{
  Common.removeMatchingElements("#colorPickerDiv", contentDocument);

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
