// On document load
$(document).ready(function() {
    // show tabs
    restore_options();

    $("#saveButton").click(function() {
        save_options()
    });

    $('input[name="magnifyGlass"]').on('change', function() {
        showGlass($(this).val())
    })
    $('#mapbg').change(function() {
        showMapBg($(this).is(':checked'))
    });
    $('#toolbar').change(function() {
        showToolbar($(this).is(':checked'))
    });
    $('#gridSize').change(function() {
        showGrid($(this).val());
    });
    $('#clickType').change(function() {
        showDirections($(this).is(':checked'))
    });
});

// Restores select box state to saved value from localStorage.
function restore_options() {
    chrome.storage.sync.get(['magnifierGlass', 'MapBg', 'clickType', 'toolbar', 'gridSize'],
        function(a) {
            var magnifyGlass = $('.magnifyGlass input');

            for (i = 0; i < magnifyGlass.length; i++) {
                magnifyGlass[i].checked = (magnifyGlass[i].value === a['magnifierGlass']);
            }
            $('#gridSettings').css('display',(a['magnifierGlass'] == 'none')?'none':'inherit');

            $('#mapbg').prop('checked', a['MapBg']);
            showMapBg(a['MapBg']);

            $('#toolbar').prop('checked', a['toolbar']);

            $('#clickType').prop('checked', a['clickType']);
            showDirections(a['clickType']);

            $('#gridSize').val(a['gridSize']);
            showGrid(a['gridSize']);
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
            '<li>Explore the page for the desired color (wait the piker lents to catch up with the current position.)</li>' +
            '<li>Left or right-click the point - you may repeat this step.</li>' +
            '<li>Open again the extension to finish the selection.</li>');
    } else {
        $('#directionList').html(
            '<li>Click Color-Picker button for either Background or Foreground.</li>' +
            '<li>Explore the page for the desired color (wait the piker lents to catch up with the current position.)</li>' +
            '<li>Click the point - you may repeat this step.</li>' +
            '<li>Open again the extension to finish the selection.</li>');
    }

    chrome.storage.sync.set({
        'clickType': $('#clickType').is(':checked')
    });
}