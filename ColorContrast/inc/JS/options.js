// On document load
$(document).ready(function() {
    // show tabs
    addCssClass('.mapBg', 'background-image: url("'+chrome.extension.getURL("/images/mapbg.png")+'");', 'styles');
    addCssClass('@font-face', 'font-family: "Poiret One";\n\t\tfont-weight: 400;\n\t\tsrc: url("'+chrome.extension.getURL("/fonts/Poiret One.woff2")+'") format("woff2");', 'fonts');
    
    $('input[name="magnifyGlass"]').on('change', function() {
        showGlass($(this).val())
    })
    $('#mapbg').change(function() {
        showMapBg($(this).is(':checked'))
    });
    $('#toolbar').change(function() {
        showToolbar($(this).is(':checked'))
    });
    $('#sample').change(function() {
        showSample($(this).is(':checked'))
    });
    $('#gridSize').bind('input',function() {
        showGrid($(this).val());
    });
    $('#clickType').change(function() {
        showDirections($(this).is(':checked'))
    });
    $('#autoCopy').change(function() {
        showAutoCopy($(this).is(':checked'))
    });
    $.each($('img'), function(index, value) {
        $value = $(value);
        $value.attr('src', chrome.extension.getURL($value.attr('src'))).attr('alt', '');
    })
    restore_options($.Deferred());
});

function addCssClass(className, classValue, styleId) {
    if(!styleId) styleId='css-modifier-container';
    if ($('#'+styleId).length == 0) {
        $('head').prepend('<style id="'+styleId+'"></style>');
    }

    $('#'+styleId).append('\t'+className + "{\n\t\t" + classValue + "\n\t}\n");
};

function getOptions(optionsDfr) {
    chrome.extension.connect().postMessage({type: 'get-defaults'});
    return optionsDfr.promise();
};
        

// Restores select box state to saved value from localStorage.
function restore_options(optionsDfr) {
    chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
        switch (req.type) {
            case 'defaults':
                optionsDfr.resolve(req);
                break;
        }
    });

    getOptions(optionsDfr).done(function(options) {
        var magnifyGlass = $('.magnifyGlass input');

        for (var i = 0; i < magnifyGlass.length; i++) {
            magnifyGlass[i].checked = (magnifyGlass[i].value === options.magnifierGlass);
        }
        $('#gridSettings').css('display',(options.magnifierGlass == 'none')?'none':'inherit');

        $('#mapbg').prop('checked', options.MapBg);
        showMapBg(options.MapBg);

        $('#toolbar').prop('checked', options.toolbar);

        $('#sample').prop('checked', options.sample);

        $('#autoCopy').prop('checked', options.autoCopy);

        $('#clickType').prop('checked', options.clickType);
        showDirections(options.clickType);

        $('#gridSize').val(options.gridSize);
        showGrid(options.gridSize);
        $('#gridSize').css("display", "block");
    });
}

function showGlass(val) {
    chrome.storage.sync.set({
        'magnifierGlass': val
    });
    $('#gridSettings').css('display',(val == 'none')?'none':'inherit');
}

function showMapBg(show) {
    if (show) {
        $('.glassBox').addClass('mapBg')
    } else {
        $('.glassBox').removeClass('mapBg');
    }

    chrome.storage.sync.set({
        'MapBg': $('#mapbg').is(':checked')
    });
}

function showToolbar(show) {
    chrome.storage.sync.set({
        'toolbar': $('#toolbar').is(':checked')
    });
}

function showSample(show) {
    chrome.storage.sync.set({
        'sample': $('#sample').is(':checked')
    });
}

function showGrid(val) {
    $('#gridSizeVal').text(val);

    $('#grid').empty();
    var grid=$(document.createElement('table'));
    grid.attr("cellspacing", 1);
    $('#grid').append(grid);
    for(var i=0; i<val; i++) {
        var tr=$(document.createElement('tr'));
        grid.append(tr);
        for(var j=0; j<val; j++) {
        var td=$(document.createElement('td'));
        tr.append(td);
        }
    }

    chrome.storage.sync.set({
        'gridSize': $('#gridSize').val()
    });
}

function showDirections(show) {
    $('#directionList').html(
        '<li>'+(show?'Click <kbd>Picker Color</kbd> button.':'Click a <kbd>Color-Picker</kbd> button for either Background or Foreground.')+'</li>' +
        '<li>Explore the page for the desired color.</li>' +
        '<li>'+(show?'Left or right-c':'C')+'lick the point - you may repeat this step.</li>' +
        '<li>(Click-and-Drag to get the averge color over multiple pixels.)</li>' +
        '<li>Use the <img src="'+chrome.extension.getURL('/images/menu.png')+'"></img> menu button on the toolbar for more options. (Look for shortcuts.)</li>'+
        '<li>(You may display a text sample, or you may select some challenged visions and effects.)</li>'+
        '<li>Click again the extension button <img src="'+chrome.extension.getURL('/images/logos/16.png')+'"></img> to finish the selection and play with the results.</li>'+
        '<li>When there are choices for foreground with AAA contrast, click an <kbd>OK</kbd> button to accept it.<br/>'+
        '(You may toggle colors to get choices for the background color.)</li>');

    chrome.storage.sync.set({
        'clickType': $('#clickType').is(':checked')
    });
}

function showAutoCopy(show) {
    chrome.storage.sync.set({
        'autoCopy': $('#autoCopy').is(':checked')
    });
}
