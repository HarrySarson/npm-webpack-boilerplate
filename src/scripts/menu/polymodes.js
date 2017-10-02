var $ = require('jquery');
var menu = require("./menu.js");
var polylib = require("../polynomial.js");

var addedmodes = {};

/* Adds a mode or list of modes to the menu
 *
 * @param {selector, dom element} el - element to add the buttons for each mode to
 *
 * either:
 *   @param {string} modename - name of mode to add a button to represent
 *  @param {object} modename - keys: mode names as a string, values: can be anything
 *
 * @return {String} - element the new mode has been added to wrapped in jQuery
 */
var extendedadd = function(modename) {
    var modes = modename;
    if(typeof modes == "string"){
        modes = {};
        modes[modename] = true;
    }
    
    var $row = $(document.createElement('div')).addClass('row buttons');
    var $el = $(el);
    
    var sortedKeys = Object.keys(modes).sort();
        
    sortedKeys.forEach(function(key){
        if(!addedmodes[key]){
            $el.append($row.clone().html('<div><p>' + key + '</p></div>'));
            addedmodes[key] = true;
        }
        
    });
    
    menu.animate($el);
    
    return $el;
}


module.exports = function(menu){
    var oldadd = menu.add;
    menu.add = extendedadd;
}
