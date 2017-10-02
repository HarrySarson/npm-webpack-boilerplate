var $ = require('jquery');


var modern = require('browsernizr');

var menuproto = {};

/* Adds css classes and onclick handlers to cells in the menu within a row with the class buttons
 *
 * @param {function} callonclick - function called when a cell is clicked, the function should accept as an argument
 *                                  the event object
 *
 
 *
 * @return {this} 
 */
menuproto.animate = function(callonclick){
    if(this.isAnimated) return;
    var self = this;
    $(document).ready(function () {
        /* add class to all elements with the class buttons to enable the css animation for
           mouseover, also add flag so extra rows added with menuproto.add are also enabled */
        self.isAnimated = true;
        self.el.find(".buttons").addClass("live");
        
        var totalDivs = self.el.find(".buttons div").length;
        
        self.el.on('mouseenter.hoverHack', '.buttons div', function(event) {
            var $this = $(event.currentTarget );
            if(!$this.hasClass('unhover')){
                $this.addClass('unhover');   
            }
        });
        if(callonclick){
            self.el.on('click', 'div', function(event){
                if(callonclick){
                    callonclick(event);
                    event.stopPropagation(); // this stops other event handlers firing, possible problem?
                }
            });
        }
    });
    return this;
};



menuproto.toggle = function(){

    var faded = this.el.filter('.faded');

    if(faded.length != 0){
        faded.removeClass('hidden faded');
    }else{
        this.el.addClass('faded');
        this.el.find('.unhover').removeClass('unhover');
        if(!modern.csstransitions){
            this.el.addClass('hidden');
        }
    }
}
menuproto.hide = function(){

    this.el.addClass('faded');
    this.el.find('.unhover').removeClass('unhover');
    if(!modern.csstransitions){
        this.el.addClass('hidden');
    }
}
menuproto.show = function(){

    var faded = this.el.filter('.faded');

    if(faded.length != 0){
        faded.removeClass('hidden faded');
    }
}

 

var addtolastrow = function(el,arr,first,last){
    var lastrow = el.find('.row').last();
    while(first < last){
        lastrow.append('<div><p>' + arr[first] + '</p></div>');
        ++first;
    }
}

/* Add a cell to the menu
 *
 * EITHER:  @param {string} text - text to have in the cell
 * OR:      @param {array} text - array of strings, each will be added to the menu in turn,
 *                                 this method will add as many cells to the table as there are elements in the array
 *
 *
 * @return {this} 
 */
menuproto.add = function(text){
    var arr = text;
    var $row = $(document.createElement('div')).addClass('row buttons');
    if(this.isAnimated) 
        $row.addClass('live');
    if(typeof arr == "string"){
        arr = [];
        arr[0] = text;
    }
    if(this.colcount === undefined){
        /* create first row before any cells are added */
        this.colcount = 0;
        this.el.append($row.clone());
    }
    if(isNaN(this.width)){
        /* menu has only one row, add to existing row */
        addtolastrow(this.el,arr,0,arr.length);
        this.colcount += arr.length;
    }else{
        /* menu has multiple rows so add to existing row, possibly creating more rows as needed */
        var i = 0;
        while(i < arr.length){
            if(this.width-this.colcount >= arr.length-i){
                /* add all cells to last row */
                addtolastrow(this.el,arr,i,arr.length);
                this.colcount += arr.length-i;
                i = arr.length;
            }else{
                /* add as many cells as possible */
                addtolastrow(this.el,arr,i,i+this.width-this.colcount);
                /* create extra row */
                this.el.append($row.clone());
                i += this.width-this.colcount
                this.colcount = 0;
            } 
        }        
    }
    return this;
}

/* Creates a menu to which cells can be added
 *
 * @param {selector, dom element} el - element which will be the menu
 *
 * either:
 *   @param {object} options - 
 *      optional: width - integer number of cells the menu is to be wide, NaN values mean table will expand
 *                              sideways as more cells are added (this may mean table is wider or that each cell is smaller)
 *
 * @return {String} - element the new mode has been added to wrapped in jQuery
 */
module.exports = function(el,options){
    var menu = Object.create(menuproto);
    options = options || {};
    menu.width = options.width || Infinity;
    
    menu.el = $(el);
    menu.el.addClass('menu');
    
    

    menu.el.on('transitionend webkitTransitionEnd', function(){
        menu.el.filter('.faded').addClass('hidden');
    });
        
    return menu;
}


