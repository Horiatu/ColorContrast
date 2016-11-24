// On document load
$(document).ready(function() {
    // show tabs
    addCssClass('.mapBg', 'background-image: url("'+chrome.extension.getURL("/images/mapbg.png")+'");', 'styles');
    addCssClass('@font-face', 'font-family: "Poiret One";\n\t\tfont-weight: 400;\n\t\tsrc: url("'+chrome.extension.getURL("/fonts/Poiret One.woff2")+'") format("woff2");', 'fonts');
    
    $('input[name="magnifyGlass"]').on('change', function() {
        showGlass($(this).val());
    });
    $('#mapbg').change(function() {
        showMapBg($(this).is(':checked'));
    });
    $('#toolbar').change(function() {
        showToolbar($(this).is(':checked'));
    });
    $('#sample').change(function() {
        showSample($(this).is(':checked'));
    });
    $('#gridSize').bind('input',function() {
        showGrid($(this).val());
    });
    $('#clickType').change(function() {
        showDirections($(this).is(':checked'));
    });
    $('#autoCopy').change(function() {
        showAutoCopy($(this).is(':checked'));
    });
    $('input[id="testPageUrl"]').on('input', function() {
        testPageUrlChanged($(this).val());
    });
    $('#testPageTry').click(function() {
        window.open($('#testPageUrl').val());
    });

    $.each($('img'), function(index, value) {
        $value = $(value);
        $value.attr('src', chrome.extension.getURL($value.attr('src'))).attr('alt', '');
    });
    restore_options($.Deferred());
});

function addCssClass(className, classValue, styleId) {
    if(!styleId) styleId='css-modifier-container';
    if ($('#'+styleId).length === 0) {
        $('head').prepend('<style id="'+styleId+'"></style>');
    }

    $('#'+styleId).append('\t'+className + "{\n\t\t" + classValue + "\n\t}\n");
}

function saveOption(option, value){
    chrome.storage.sync.set({
        option: value
    });
}

function getOptionAsync(option, defaultVal) {
    var dfr = $.Deferred();
    chrome.storage.sync.get(option, function(a) {
        if(a[option] && a[option] !== undefined && a[option] !== '') {
            result = a[option];
        }
        else
        {
            result = defaultVal;
        }
        dfr.resolve(result);
    });
    return dfr.promise();
}

function getOptions(optionsDfr) {
    chrome.extension.connect().postMessage({type: 'get-defaults'});
    return optionsDfr.promise();
}
        

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
        $('#grid').on('mousewheel', gridOnWheel);
        $('#gridSize').css("display", "block");

        $('#testPageUrl').val(options.testPageUrl);
        testPageUrlChanged(options.testPageUrl);
    });
}

function showGlass(val) {
    saveOption('magnifierGlass', val);
    $('#gridSettings').css('display',(val == 'none')?'none':'inherit');
}

function testPageUrlChanged(val) {
    saveOption('testPageUrl', val);
    $('#testPageTry').css('display',(val === '')?'none':'inherit');
}

function showMapBg(show) {
    if (show) {
        $('.glassBox').addClass('mapBg');
    } else {
        $('.glassBox').removeClass('mapBg');
    }

    saveOption('MapBg', $('#mapbg').is(':checked'));
}

function showToolbar(show) {
    saveOption('toolbar', $('#toolbar').is(':checked'));
}

function showSample(show) {
    saveOption('sample', $('#sample').is(':checked'));
}

function gridOnWheel() {
    var w = event.wheelDelta;
    event.stopPropagation();
    event.preventDefault();
    var gridSize = parseInt($('#gridSize').val());
    if(Math.abs(w)>=150 && (gridSize <= 23 || gridSize >= 9)) {
        if(w>=150) {
            gridSize += 2;
        }
        else if(w<=-150){
            gridSize -= 2;
        }
        $('#gridSize').val(gridSize);
        showGrid(gridSize);
    }
    return false;
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

    saveOption('gridSize', $('#gridSize').val());
}

// function getGridSize() {
//     var dfr = $.Deferred();
//     chrome.storage.sync.get('gridSize', function(a) {
//         if(a.gridSize && a.gridSize !== undefined && a.gridSize !== '') {
//             gridSize = parseInt(a.gridSize);
//         }
//         else
//         {
//             gridSize = 15;
//         }
//         dfr.resolve(gridSize);
//     });
//     return dfr.promise();
// }

function showDirections(show) {
    $('#directionList').html(
        '<li>'+(show?'Click <kbd>Picker Color</kbd> button.':'Click a <kbd>Color-Picker</kbd> button for either Background or Foreground.')+'</li>' +
        '<li>Explore the page for the desired color.</li>' +
        '<li>'+(show?'Left or right-c':'C')+'lick the point - you may repeat this step.</li>' +
        '<li>(Click-and-Drag to get the averge color over multiple pixels.)</li>' +
        '<li>Use the <img src="'+chrome.extension.getURL('/images/menu.png')+'"></img> menu button on the toolbar for more options. (Look for shortcuts.)</li>'+
        '<li>(You may display a text sample, or you may select some challenged visions and effects.)</li>'+
        '<li>Click again the extension button <img src="'+chrome.extension.getURL('/images/logos/16.png')+'"></img> to finish the selection and play with the results.</li>'+
        '<li>When there are choices for A, AA or AAA compliance click an <kbd>OK</kbd> button to accept it.</li>');

    saveOption('clickType', $('#clickType').is(':checked'));
}

function showAutoCopy(show) {
    saveOption('autoCopy', $('#autoCopy').is(':checked'));
}
