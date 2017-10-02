var undefined;
var $ = require("jquery");
var _ = require("lodash");

module.exports = exports = function(){
    this.events = {};
};
  
 /**
     * Binds callback to the event, the this arguement of each callback will be set to the 
     * keyboard_input object if and when the callback is called.
     * The call back will be called when emit() is called with the parameter event the same
     * as the event the callback is bound to by this method
     *
     * @memberOf keyboard_input
     * @param {string} (required) event String identifying the event
     * @param {function} (optional) callback Function to be called by emit(), if parameter is omitted
     *                                  function will do nothing
     * @returns {keyboard_input} Returns this
     * @example
     *
     *  keyboard_input.on('fire', function(x) { console.log("fire" + x); });
     *  keyboard_input.on('fire', function(x) { 
     *      dosomething(x);
     *  });
     * 
     * keyboard_input.emit('fire',99); // log: "fire99",
     *
     */
exports.prototype.on = function (event, callback) {
    if (!this.events[event]) {
        this.events[event] = [];
    }
    if(callback && callback.call)
        this.events[event].push(callback);
    return this;
};

 /**
     * Calls all the callbacks bound to the event, note this arguement of each callback is bound to the keyboard_input object
     *
     * @memberOf keyboard_input
     * @param {string} (required) event String identifying the event
     * @param {*} (optional) data Optional data to pass to each callback
     * @returns {keyboard_input} Returns this
     * @example
     *
     *  keyboard_input.on('fire', function(x) { console.log("fire" + x); });
     *  keyboard_input.on('fire', function(x) { 
     *      this.emit('celebrate'); 
     *  });
     *
     * keyboard_input.on('celebrate', function() { console.log("yahha") });
     * 
     * keyboard_input.emit('fire',99); // log: "fire99", "yahha"
     *
     */
exports.prototype.emit = function (event, data) {
    var callbacks = this.events[event];
    var self = this;
    if (callbacks) {
        callbacks.forEach(function (callback) {
            callback.call(self,data);
        });
    }
    return this;
};
exports.prototype.bindButtonPress = function (selector, toEmit, data) {
    $(selector).click(this.emit.bind(this,toEmit, data));
    return this;
};
 
exports.noModifiers = function(event){
    return !(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey);    
}
exports.ignoreModifiers = function(event){
    return true;
}
exports.capitalModifiers = function(event){
    if(event.cntlKey || event.altKey || event.metaKey) return false;

    return event.upperCase;
}
/* works for strings aswell as arrays */
var hackForEach = function(arr,fun){
    for(var i = 0; i < arr.length; ++i){
        fun(arr[i],i,arr);
    }
}

 /**
     * Adds keypress event handler to element given by keyboardSelector, 
     * when a given key is pressed (with or without a modifier)
     * the object will emit the relevant signal
     *
     * **Note**: The function requires a character map object, this is a 
     * basic object containing the following properties:
     * -    characters: {string|number|array} (required) A single character (e.g. 'r'), a single charcode (e.g. 13), 
     *          an array of characters or charcodes (e.g. ['r','h',13,'u']) or a string which will be treated 
     *          as a character array (e.g. 'heyGhg' is equivalent to ['h','e','y','G','h','g'])
     *          **note**, characters are case insensitive, to match only upper case use a modifier function
     *          **note**, '/n' and '\r' will both match both keycodes 10 and 13 
     * -    modifier: {function|Boolean} (optional) A function that checks whether to emit a signal based on which modifiers are pressed,
     *          the function will be passed the jQuery event object, the extra properties 'capsKey' (to indicate whether caplock is on) and
     *          'upperCase' (to indicate whether the character is a capital letter-false for special keys) will have been added to the
     *          object, the function should return true to emit the signal, false to not emit
     *          If this modifiers is false then the signal will only be emitted if there are no modifiers and if modifiers is
     *          true then the signal will be emitted regardless of modifiers.
     *          Default value is true
     * -    emit: {string} (required) The signal to emit when the given key is pressed, a string of the character pressed will be passed to the callback
     * -    preventDefualt {Boolean} (optional) If truthsy then when a signal is emitted, event.preventDefault will be called
     *
     * @memberOf keyboard_input
     * @param {jQuery|element|selector} keyboardSelector The object to bind the keypress event to
     * @param {object|array} characterMap Either the character map object or an array of multiple character map objects
     * @returns {keyboard_input} Returns this
     * @example
     *
     * keyboard_input.on('fire', function() { console.log("fire") });
     * keyboard_input.on('defend', function(prob) { 
     *     if(Math.random() < prob) 
     *         console.log("defended"); 
     *     else 
     *         console.log("I've been hit")});
     * keyboard_input.bindKeyPress('body',[{
     *     characters: 'f',
     *     modifier: function(event){
     *         return event.shiftKey && !(event.altKey || event.metaKey || event.cntrlKey);   
     *     },
     *     emit: 'fire'
     * },
     * {
     *     characters: 'd\n2',
     *     emit: 'defend',   
     * }]);
     * 
     *
     */
exports.prototype.bindKeyPress = function (keyboardSelector, characterMap) {
    
    keyboardSelector = $(keyboardSelector);
    var self = this;
    var keys = {};
    
    /* if characterMap is not an array, make it one */
    if(!Array.isArray(characterMap)){
        characterMap = [characterMap];
    }
    characterMap.forEach(function(val){
        /* turn characters property of each characterMap into array of keycodes */
        
        var characters = val.characters;
        val.characters = [];
        /* if characters is not an array, make it one */
        if(!Array.isArray(characters)){
            characters = [characters];
        }
        hackForEach(characters,function(c){
            var s = c.charCodeAt ? /* c is char */ c : /* c is charcode */ String.fromCharCode(c);
            var charcode = s.toUpperCase().charCodeAt(0);
            if(!_.includes(val.characters,charcode))
                val.characters.push(charcode);
            
            /* special case where char is '\n' or '\r' */
            if(charcode == 10 && !_.includes(val.characters,13))
                val.characters.push(13);
            else if(charcode == 13 && !_.includes(val.characters,10))
                val.characters.push(10);
        });
        
        /* turn modifier property of each characterMap into function */
        
        if(val.modifier === true){
            val.modifier = exports.ignoreModifiers;
        }else if(!val.modifier){
            /* false or undefined */
            val.modifier = exports.noModifiers
        }
    });
    
    keyboardSelector.on("keypress",function(event){
        /* add capsKey property */
        
        var s = String.fromCharCode(event.which);
        var upperS = s.toUpperCase();
        event.upperCase = upperS === s && s.toLowerCase() !== s;
        event.capsKey  = event.upperCase && !event.shiftKey;
        
        characterMap.forEach(function(val){
            hackForEach(val.characters,function(c){
                if(c == upperS.charCodeAt(0) && val.modifier(event)){
                    self.emit(val.emit,s);
                    if(val.preventDefault)
                        event.preventDefault();
                }         
            });
        });             
    });
    return this;
};
module.exports.prototype.targetIsInput = function (event) {
    return event.target.tagName.toLowerCase() === "input";
};
module.exports.prototype.getModifiers = function(event) {
    return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
};