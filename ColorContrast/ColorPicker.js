var ColorPicker = ColorPicker || {};
ColorPicker.colorPickerToolbar = null;
ColorPicker.colorPickerViewer = null;
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
  console.log(contentDocument);

  if(!contentDocument.getElementById("colorPickerDiv")) {
    ColorPicker.colorPickerViewer = contentDocument.createElement("Div");
    ColorPicker.colorPickerViewer.setAttribute("id", "colorPickerViewer");
    ColorPicker.colorPickerViewer.setAttribute("style", 
      "position: fixed; padding:2px; "+
      "border: 1px solid gray; border-radius: 35px; overflow: hidden;"+
      "visibility:visible;");
    ColorPicker.getDocumentBodyElement(contentDocument).appendChild(ColorPicker.colorPickerViewer);



    ColorPicker.colorPickerToolbar = contentDocument.createElement("Div");
    ColorPicker.colorPickerToolbar.setAttribute("id", "colorPickerDiv");
    ColorPicker.colorPickerToolbar.setAttribute("style", 
      "position: fixed; padding:2px; "+
      "width:100px; "+
      "right: 10px; bottom:10px; "+
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
      var tagName     = eventTarget.tagName;

      // If the event target is not the color picker, the color picker is not an ancestor of the event target and the event target is not a scrollbar
      if(eventTarget != colorPicker && !ColorPicker.isAncestor(eventTarget, colorPicker) && tagName && tagName.toLowerCase() != "scrollbar")
      {
        var colorPicker = ownerDocument.getElementById("colorPickerViewer");
        colorPicker.style.left = event.clientX+8+"px";
        colorPicker.style.top  = event.clientY+8+"px";
        chrome.extension.sendMessage({type: "get-color", x: event.clientX, y: event.clientY, eventType: type});
        //console.log(event);

        var colorViewer = ownerDocument.getElementById("colorPickerViewer");

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
  ColorPicker.colorDiv.setAttribute("style", "position:fixed; width:18px; height:18px; background-color:" + color + ";");
  ColorPicker.colorTxt.innerHTML = color;
};

//var colorM = null;
ColorPicker.setColors = function(colors, type)
{
  var deep = colors.length;
  m=(deep-1)/2;
  //colorM = colors[m][m];
  var s='<table style="border-collapse:collapse;">';
  for(i=0; i<deep; i++) {
    s+='<tr>';
    
    for(j=0; j<deep; j++) {
      //if(colorM != colors[m][m]) return;
      color=colors[j][i];
      if(!color) {
        color='transparent';
      }
      var ctx = i==m && j==m;
      var b=(ctx)?'red':'rgba(100, 100, 100, 0.2)';
      s+='<td style="padding:0px; border:'+(ctx?2:1)+'px solid '+b+'; ">'+
      '<div style="padding:0px; width:7px; height:7px; background-color:'+color+';"></div></td>';
    }

    s+='</tr>';
  }
  s+='</table>';
  ColorPicker.colorPickerViewer.innerHTML = s;
};
