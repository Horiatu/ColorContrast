// On document load
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-109917224-2']);
_gaq.push(['_trackPageview']);

(function() {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
})();

$(document).ready(function() {
    // show tabs
    addCssClass('.mapBg', 'background-image: url("' + chrome.extension.getURL("/images/mapbg.png") + '");', 'styles');
    addCssClass('@font-face', 'font-family: "Poiret One";\n\t\tfont-weight: 400;\n\t\tsrc: url("' + chrome.extension.getURL("/fonts/Poiret One.woff2") + '") format("woff2");', 'fonts');

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
    $('#gridSize').bind('input', function() {
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
    $('#testPageTry').on("click", function() {
        window.open($('#testPageUrl').val());
    });

    $.each($('img'), function(index, value) {
        $value = $(value);
        $value.attr('src', chrome.extension.getURL($value.attr('src'))).attr('alt', '');
    });
    restore_options($.Deferred());
});

function addCssClass(className, classValue, styleId) {
    if (!styleId) styleId = 'css-modifier-container';
    if ($('#' + styleId).length === 0) {
        $('head').prepend('<style id="' + styleId + '"></style>');
    }

    $('#' + styleId).append('\t' + className + "{\n\t\t" + classValue + "\n\t}\n");
}

function getOptions(optionsDfr) {
    chrome.extension.connect().postMessage({ type: 'get-defaults' });
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
        $('#gridSettings').css('display', (options.magnifierGlass == 'none') ? 'none' : 'inherit');

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
        $('#gridSize').on('mousewheel', gridOnWheel);
        $('#gridSizeVal').on('mousewheel', gridOnWheel);
        $('#gridSize').css("display", "block");

        $('#testPageUrl').val(options.testPageUrl);
        testPageUrlChanged(options.testPageUrl);

        $('#version').html(options.version);
    });
}

function showGlass(val) {
    chrome.storage.sync.set({ 'magnifierGlass': val });
    $('#gridSettings').css('display', (val == 'none') ? 'none' : 'inherit');
}

function testPageUrlChanged(val) {
    chrome.storage.sync.set({ 'testPageUrl': val });
    $('#testPageTry').css('display', (val === '') ? 'none' : 'inherit');
}

function showMapBg(show) {
    if (show) {
        $('.glassBox').addClass('mapBg');
    } else {
        $('.glassBox').removeClass('mapBg');
    }

    chrome.storage.sync.set({ 'MapBg': $('#mapbg').is(':checked') });
}

function showToolbar(show) {
    chrome.storage.sync.set({ 'toolbar': $('#toolbar').is(':checked') });
}

function showSample(show) {
    chrome.storage.sync.set({ 'sample': $('#sample').is(':checked') });
}

function gridOnWheel() {
    var w = event.wheelDelta;
    event.stopPropagation();
    event.preventDefault();
    var gridSize = parseInt($('#gridSize').val());
    if (Math.abs(w) >= 150 && (gridSize <= 23 || gridSize >= 9)) {
        gridSize += Math.sign(w) * 2;
        $('#gridSize').val(gridSize);
        showGrid(gridSize);
    }
    return false;
}

function showGrid(val) {
    $('#gridSizeVal').text(val);

    $('#grid').empty();
    var grid = $(document.createElement('table'));
    grid.attr("cellspacing", 1);
    $('#grid').append(grid);

    for (var i = 0; i < val; i++) {
        var tr = $(document.createElement('tr'));
        grid.append(tr);
        for (var j = 0; j < val; j++) {
            var td = $(document.createElement('td'));
            tr.append(td);
        }
    }

    chrome.storage.sync.set({ 'gridSize': $('#gridSize').val() });
}

function showDirections(show) {
    $('#directionList').html(
        '<li>' + (show ? 'Click <kbd>Picker Color</kbd> button.' : 'Click a <kbd>Color-Picker</kbd> button for either Background or Foreground.') + '</li>' +
        '<li>Explore the page for the desired color.</li>' +
        '<li>' + (show ? 'Left or right-c' : 'C') + 'lick the point - you may repeat this step.</li>' +
        '<li>(Click-and-Drag to get the averge color over multiple pixels.)</li>' +
        '<li>Use the <img src="' + chrome.extension.getURL('/images/menu.png') + '"></img> menu button on the toolbar for more options. (Look for shortcuts.)</li>' +
        '<li>(You may display a text sample, or you may select some challenged visions and effects.)</li>' +
        '<li>Click again the extension button <img src="' + chrome.extension.getURL('/images/logos/16.png') + '"></img> to finish the selection and play with the results.</li>' +
        '<li>When there are choices for A, AA or AAA compliance click an <kbd>OK</kbd> button to accept it.</li>');

    chrome.storage.sync.set({ 'clickType': $('#clickType').is(':checked') });
}

function showAutoCopy(show) {
    chrome.storage.sync.set({ 'autoCopy': $('#autoCopy').is(':checked') });
}