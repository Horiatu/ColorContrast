// Saves options to localStorage.
    function save_options() {
        if (!window.localStorage) {
            alert("Error local storage is unavailable.");
            window.close();
        }

        magnifyGlass = document.getElementById('magnifyGlassDisk').checked ? 'circle' : 'magnifyGlass';
        window.localStorage.magnifierGlass =  magnifyGlass;

        // Update status to let user know options were saved.
        var status = document.getElementById("status");
        status.innerHTML = "Options Saved.";
        $('#status').fadeIn(20);
        $('#status').fadeOut(1500,function() {
            status.innerHTML = "";
        });
    }

// Restores select box state to saved value from localStorage.
function restore_options() {
    disk = window.localStorage.magnifierGlass === 'circle';
    document.getElementById('magnifyGlassDisk').checked = disk;
    document.getElementById('magnifyGlass').checked = !disk;
}

// On document load
$(document).ready(function() {
    // show tabs
    restore_options();

    $("#saveButton").click(function() { save_options() });
});
