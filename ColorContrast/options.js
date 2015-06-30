// On document load
$(document).ready(function() {
    // show tabs
    restore_options();

    $("#saveButton").click(function() { save_options() });

    $('#mapbg').change(function () {showMapBg($(this).is(':checked'))});
});

function showMapBg(show) {
    if (show) {
        $('.glassBox').addClass('mapBg');
    } else {
        $('.glassBox').removeClass('mapBg');
    }
}

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
    
    var status = document.getElementById("status");
    status.innerHTML = "Options Saved.";
    $('#status').fadeIn(20);
    $('#status').fadeOut(1500,function() {  
        status.innerHTML = "";
    });
}

// Restores select box state to saved value from localStorage.
function restore_options() {
    chrome.storage.sync.get(['magnifierGlass', 'MapBg'], 
        function(a) {
            var magnifyGlass = $('.magnifyGlass input');
    
            for(i=0; i<magnifyGlass.length; i++) {
                magnifyGlass[i].checked = (magnifyGlass[i].value === a['magnifierGlass']);
            }

            $('#mapbg').prop('checked', a['MapBg']);
            showMapBg(a['MapBg']);
        }
    );
}

