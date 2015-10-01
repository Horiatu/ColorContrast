/*
 * 
 * jQuery.undoable()
 *
 * Copyright (c) 2009 Jared Mellentine - jared(at)mellentine(dot)com | http://design.mellentine.com
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 * Date: 3/9/2009
 * 
 * Full documentation coming soon (or you can read the 55 lines below)
 * 
 * http://mlntn.com/demos/jquery-undoable/
 */

jQuery.fn.undoable = function(redo) {
	var undo = (typeof arguments[1] == 'function') ? arguments[1] : redo;
	redo();
	var uf = jQuery('body').data('undoFunctions');		
	if (typeof uf == 'object') uf.push([redo,undo]); else uf = [[redo,undo]];
	if (jQuery('body').data('undoEnabled') !== true) $().enableUndo();
	jQuery('body').data('undoFunctions', uf);
	jQuery('body').data('redoFunctions', []); // reset the redo queue
	
	if(jQuery.fn.undoable.settings.onCanUndo) jQuery.fn.undoable.settings.onCanUndo(jQuery('body').data('undoEnabled'));
};

jQuery.fn.undoable.settings = {};

jQuery.fn.enableUndo = function(params){
	var defaults = {
		undoCtrlChar : 'z',
		redoCtrlChar : 'y',
		redoShiftReq : false,
		onCanUndo : null,
		onCanRedo : null,
		onUndo : null,
		onRedo : null,
	};
	jQuery.fn.undoable.settings = jQuery.extend(defaults, params);
	var undoChar = jQuery.fn.undoable.settings.undoCtrlChar.toUpperCase().charCodeAt();
	var redoChar = jQuery.fn.undoable.settings.redoCtrlChar.toUpperCase().charCodeAt();
	
	jQuery(document).keydown(function(e){
		// UNDO
		if (e.ctrlKey && !e.shiftKey && e.which == undoChar) {
			var uf = jQuery('body').data('undoFunctions');
			if (typeof uf == 'object') {
				var lf = uf.pop();
				if(uf.length == 0 && jQuery.fn.undoable.settings.onCanUndo) jQuery.fn.undoable.settings.onCanUndo(false);
				jQuery('body').data('undoFunctions', uf);

				if (lf) {
					var rf = jQuery('body').data('redoFunctions');
					if (rf) rf.push(lf); else rf = [lf];
					jQuery('body').data('redoFunctions', rf);

					lf[1](); // undo is index 1
				}
				if(jQuery.fn.undoable.settings.onCanRedo) jQuery.fn.undoable.settings.onCanRedo(jQuery('body').data('undoEnabled'));
				if(jQuery.fn.undoable.settings.onUndo) jQuery.fn.undoable.settings.onUndo();
			}
		}
		// REDO
		if (e.ctrlKey && (e.shiftKey || !jQuery.fn.undoable.settings.redoShiftReq) && e.which == redoChar) {
			var rf = jQuery('body').data('redoFunctions');
			if (typeof rf == 'object') {
				var lf = rf.pop();
				if(rf.length == 0 && jQuery.fn.undoable.settings.onCanRedo) jQuery.fn.undoable.settings.onCanRedo(false);
				jQuery('body').data('redoFunctions', rf);

				if (lf) {
					var uf = jQuery('body').data('undoFunctions');
					if (uf) uf.push(lf); else uf = [lf];
					jQuery('body').data('undoFunctions', uf);

					lf[0](); // redo is index 0
				}
				if(jQuery.fn.undoable.settings.onCanUndo) jQuery.fn.undoable.settings.onCanUndo(jQuery('body').data('undoEnabled'));
				if(jQuery.fn.undoable.settings.onRedo) jQuery.fn.undoable.settings.onRedo();
			}
		}
	});
	jQuery('body').data('undoEnabled', true);
};

