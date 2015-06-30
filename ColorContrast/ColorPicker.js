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

ColorPicker.createColorPicker = function(contentDocument)//, toolbarHTML)
{
  if(!contentDocument.getElementById("colorPickerCursor")) {
    var colorPickerCss = '<link id="colorPickerCss" rel="stylesheet" type="text/css" href="'+chrome.extension.getURL('ColorPicker.css')+'" />';
    var css = '<Style id="colorPickerCursor">\n'+
    ' * { cursor: url('+chrome.extension.getURL("Images/Cursors/pickColor.cur")+'), crosshair !important; }\n'+
    '</Style>';
    if ($("head").length == 0) { 
      $("body").before(colorPickerCss);
      $("body").before(css);
    } else {
      $("head").append(colorPickerCss);
      $("head").append(css);
    }
  }
    
  chrome.storage.sync.get(['magnifierGlass'], function(a) {
    showMagnifier = a['magnifierGlass'] != 'none';
  });

  if(showMagnifier && !contentDocument.getElementById("colorPickerDiv")) {
    ColorPicker.colorPickerViewer = contentDocument.createElement("Div");
    ColorPicker.colorPickerViewer.setAttribute("id", "colorPickerViewer");
    
    var t = contentDocument.createElement("Table");
    t.setAttribute("cellspacing", "1");
    t.setAttribute("id", "colorPickerViewerTable");
    ColorPicker.colorPickerViewer.appendChild(t);

    chrome.storage.sync.get(['magnifierGlass'], 
      function(a) {
          if(a['magnifierGlass']) {
            var d = contentDocument.createElement("div");
            var i = contentDocument.createElement("img");
    
            i.setAttribute("alt","");
            i.setAttribute("width","59px");
            i.setAttribute("height","59px");

            //console.log(a['magnifierGlass']);
            i.setAttribute("src",chrome.extension.getURL("Images/"+a['magnifierGlass']+".png"));
            d.appendChild(i);

            ColorPicker.colorPickerViewer.appendChild(d);
          }
        }
      );
    
    ColorPicker.getDocumentBodyElement(contentDocument).appendChild(ColorPicker.colorPickerViewer);

    ColorPicker.colorPickerToolbar = contentDocument.createElement("Div");
    ColorPicker.colorPickerToolbar.setAttribute("id", "colorPickerDiv");
    
    ColorPicker.colorDiv = contentDocument.createElement("Div");
    ColorPicker.colorDiv.setAttribute("id", "colorDiv");
    ColorPicker.colorPickerToolbar.appendChild(ColorPicker.colorDiv);

    ColorPicker.colorTxt = contentDocument.createElement("Span");
    ColorPicker.colorTxt.setAttribute("id", "colorTxt");
    ColorPicker.colorPickerToolbar.appendChild(ColorPicker.colorTxt);

    ColorPicker.getDocumentBodyElement(contentDocument).appendChild(ColorPicker.colorPickerToolbar);
  }

  contentDocument.addEventListener("click", ColorPicker.click, true);
  contentDocument.addEventListener("mousemove", ColorPicker.mouseMove, false);

  removeTitles();
};

ColorPicker.removeColorPicker = function(contentDocument)
{
  $("#colorPickerCursor").remove();
  $("colorPickerCss").remove();

  $("#colorPickerDiv").remove();
  $("#colorPickerViewer").remove();

  contentDocument.removeEventListener("click", ColorPicker.click, true);
  contentDocument.removeEventListener("mousemove", ColorPicker.mouseMove, false);
  restoreTitles();
};

var showMagnifier = true;
ColorPicker.displayColorPicker = function(display, contentDocument)
{
  // If displaying the color picker
  if(display)
  {
    ColorPicker.createColorPicker(contentDocument);
  }
  else
  {
    try { ColorPicker.removeColorPicker(contentDocument); } catch(err) {console.log(err);};
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
      var tagName = eventTarget.tagName;

      // If the event target is not the color picker, the color picker is not an ancestor of the event target and the event target is not a scrollbar
      if(eventTarget != colorPicker 
        && !ColorPicker.isAncestor(eventTarget, colorPicker) 
        && tagName 
        && tagName.toLowerCase() != "scrollbar")
      {
        var colorPicker = ownerDocument.getElementById("colorPickerViewer");
        var w = window.innerWidth-100;
        var h = window.innerHeight-100;
        if(event.clientX < w) {
          colorPicker.style.left = event.clientX+4+"px";
        } else {
          colorPicker.style.left = event.clientX-62+"px";
        }
        if(event.clientY < h) {
          colorPicker.style.top = event.clientY+4+"px";
        } else {
          colorPicker.style.top = event.clientY-62+"px";
        } 
        chrome.extension.sendMessage({type: "get-color", x: event.clientX, y: event.clientY, eventType: type});
        //console.log(event);

        //var colorViewer = ownerDocument.getElementById("colorPickerViewer");
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

// Sets the color
ColorPicker.setColor = function(color, type)
{
  ColorPicker.colorDiv.setAttribute("style", "position:fixed; width:18px; height:18px; background-color:" + color + ";");
  ColorPicker.colorTxt.innerHTML = color;
};

//var colorM = null;
ColorPicker.setColors = function(colors, type)
{
  if(!showMagnifier) return;
  var deep = colors.length;
  m=(deep-1)/2;
  //colorM = colors[m][m];
  var s='';//<table style="border-collapse:collapse;" cellspacing="1" >';
  for(i=0; i<deep; i++) {
    s+='<tr>';
    
    for(j=0; j<deep; j++) {
      //if(colorM != colors[m][m]) return;
      color=colors[j][i];
      if(!color) {
        color='indigo';
      }
      var centre = i==m && j==m;
      s+='<td style="padding:0px; border:1px solid rgba(100, 100, 100, 0.5); width:7px; height:7px; background-color:'+color+';">';
      if(centre) {
        s+='<div style="padding:0px; width:5px; height:5px; border:1px solid rgba(255, 0, 0, 0.5); background-color:transparent;"></div>';
      }
      s+='</td>';
    }

    s+='</tr>';
  }
  ColorPicker.colorPickerViewer.childNodes[0].innerHTML = s;
};

removeTitles = function() {
  //return;
  $('[title]').bind('mousemove.hideTooltips', function () {
      $this = $(this);
      if($this.attr('title') && $this.attr('title') != '') { 
        $this.data('title', $this.attr('title'));
        $this.attr('title', '');
      }
  }).bind('mouseout.hideTooltips', function () {
      $this = $(this);
      $this.attr('title', $this.data('title'));
  });
}

restoreTitles = function() {
  //return;
  $('[title]').unbind('mousemove.hideTooltips').unbind('mouseout.hideTooltips');
  $('*[data-title!=undefined]').attr('title', $(this).data('title'));
}

