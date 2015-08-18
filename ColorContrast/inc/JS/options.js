// On document load
$(document).ready(function() {
    // show tabs
    restore_options($.Deferred());

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
    $('#gridSize').change(function() {
        showGrid($(this).val());
    });
    $('#clickType').change(function() {
        showDirections($(this).is(':checked'))
    });
    $('#autoCopy').change(function() {
        showAutoCopy($(this).is(':checked'))
    });
});

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

        for (i = 0; i < magnifyGlass.length; i++) {
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
        }
    );
}

function showGlass(val) {
    chrome.storage.sync.set({
        'magnifierGlass': val
    });
    $('#gridSettings').css('display',(val == 'none')?'none':'inherit');
}

function showMapBg(show) {
    if (show) {
        $('.glassBox').addClass('mapBg');
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
    grid=$(document.createElement('table'));
    grid.attr("cellspacing", 1);
    $('#grid').append(grid);
    for(i=0; i<val; i++) {
        tr=$(document.createElement('tr'));
        grid.append(tr);
        for(j=0; j<val; j++) {
        td=$(document.createElement('td'));
        tr.append(td);
        }
    }

    chrome.storage.sync.set({
        'gridSize': $('#gridSize').val()
    });
}

function showDirections(show) {
    if (show) {
        $('#directionList').html(
            '<li>Click Color-Picker button.</li>' +
            '<li>Explore the page for the desired color.</li>' +
            '<li>Left or right-click the point - you may repeat this step.</li>' +
            '<li>Open again the extension to finish the selection.</li>');
    } else {
        $('#directionList').html(
            '<li>Click Color-Picker button for either Background or Foreground.</li>' +
            '<li>Explore the page for the desired color.</li>' +
            '<li>Click the point - you may repeat this step.</li>' +
            '<li>Open again the extension to finish the selection.</li>');
    }

    chrome.storage.sync.set({
        'clickType': $('#clickType').is(':checked')
    });
}

function showAutoCopy(show) {
    chrome.storage.sync.set({
        'autoCopy': $('#autoCopy').is(':checked')
    });
}