// On document load
$(document).ready(function() {
    // show tabs
    restore_options();

    $("#saveButton").click(function() { save_options() });

    $('#mapbg').change(function () {showMapBg($(this).is(':checked'))});
    $('#clickType').change(function () {showDirections($(this).is(':checked'))});
});

// Saves options to localStorage.
function save_options() {
    var magnifyGlass = $('.magnifyGlass input');
    
    for(i=0; i<magnifyGlass.length; i++) {
        if(magnifyGlass[i].checked) {
            chrome.storage.sync.set({'magnifierGlass': magnifyGlass[i].value});
            break;
        }
    }

    chrome.storage.sync.set({'MapBg': $('#mapbg').is(':checked')});

    chrome.storage.sync.set({'clickType': $('#clickType').is(':checked')});
    
    var status = document.getElementById("status");
    status.innerHTML = "Options Saved.";
    $('#status').fadeIn(20);
    $('#status').fadeOut(1500,function() {  
        status.innerHTML = "";
    });
}

// Restores select box state to saved value from localStorage.
function restore_options() {
    chrome.storage.sync.get(['magnifierGlass', 'MapBg', 'clickType'], 
        function(a) {
            var magnifyGlass = $('.magnifyGlass input');
    
            for(i=0; i<magnifyGlass.length; i++) {
                magnifyGlass[i].checked = (magnifyGlass[i].value === a['magnifierGlass']);
            }

            $('#mapbg').prop('checked', a['MapBg']);
            showMapBg(a['MapBg']);

            $('#clickType').prop('checked', a['clickType']);
            showDirections(a['clickType']);
        }
    );
}

function showMapBg(show) {
    if (show) {
        $('.glassBox').addClass('mapBg');
    } else {
        $('.glassBox').removeClass('mapBg');
    }
}

function showDirections(show) {
    if (show) {
        $('#directionList').html(
          '<li>Click Color-Picker button.</li>'+
          '<li>Explore the page for the desired color (wait the piker lents to catch up with the current position.)</li>'+
          '<li>Left or right-click the point - you may repeat this step.</li>'+
          '<li>Open again the extension to finish the selection.</li>'+
          '<li>(not available yet)</li>');
    } else {
        $('#directionList').html(
          '<li>Click Color-Picker button for either Background or Foreground.</li>'+
          '<li>Explore the page for the desired color (wait the piker lents to catch up with the current position.)</li>'+
          '<li>Click the point - you may repeat this step.</li>'+
          '<li>Open again the extension to finish the selection.</li>');
    }
}

