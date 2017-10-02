var undefined;

var $ = require('jquery');
var _ = require('lodash');
var animate = require('./animate.js');
var jqueryMousewheel = require('jquery-mousewheel');

// jqueryMousewheel($);

var textInTag = function(text,tag){
    text = text || "";
    return tag ? '<' + tag + '>' + text + '</' + tag + '>' : text;
}

var atanh = function(x){
    return 0.5 * Math.log((1+x)/(1-x));
}


Math.sign = Math.sign || function(x) {
  x = +x; // convert to a number
  if (x === 0 || isNaN(x)) {
    return x;
  }
  return x > 0 ? 1 : -1;
}

/* Builds a zoom-bar from an empty div
 *
 *   @param {jQuery|HTMLelement|string, required} selector Valid selector referring to
 *              one or more empty divs which will be built into a zoom-bar
 *   @param EITHER: {object, required} args Options used to build the zoom-bars, contains following properties
 *
 *                  damping {number, optional}          damping paramter of bar (must be postitive), >1 overdamped, =1 critially damped,
 *                                                          <1 underdamped
 *                                                          default value is 1
 *                  freq {number, optional}             natural frequency for the motion of the bar in rad/ms (must be postive)
 *                                                          default value is 3e-2 ( i.e 30 rad/s )
 *                  sliderValue {function, optional}    function that converts the position of the slider (position
 *                                                          is a decimal between -1 and 1 where -1 and 1 are the top and
 *                                                          bottom of the bar respectively. The returned value will be
 *                                                          displayed on the slider.
 *                                                          e.g. function(pos) { return (pos*100).toFixed() + "%"; }
 *                                                          default value is function(pos) { return ""; }
 *                  scroll {boolean, optional}          If scroll is a truthsy value then the middle mouse button will move the bar
 *                                                          defualt value is false
 *                  vertical {boolean, optional{        true = vertical bar, false = horizontal bar
 *                                                          default value is true        
 *                  change {function, optional}         function to be called when, on mouseup or otherwise, the user 
 *                                                          finishes moving the slider, the function will be passed as
 *                                                          an argument the final position of the slider as a decimal
 *                                                          where -1 and 1 are the top and bottom of the bar respectively.
 *                                                          **Note** change will be called when the zoom-bar is created with the 
 *                                                          initial position of the slider
 *                  move {function, optional}           function to be called every time the slider moves, the function will be passed as
 *                                                          arguments the position of the slider as a decimal
 *                                                          where -1 and 1 are the top and bottom of the bar respectively and also a 
 *                                                          time stamp
 *                  after {number, optional}            position which the zoom bar will return to when released
 *                                                          default value is null in which the bar will not return
 *                                                          default value is function(pos) { return true; } 
 *                  initialPos {number, optional}       function initial position of the slider, 
 *                                                          default value is 0
 *                  sliderMoveTime {number, optional}   the time in seconds taken for the slider to go from the centre of the bar to the top
 *                                                          when moved using the top and bottom buttons
 *                                                          default value is 1.5 (seconds), if this is zero top and bottom buttons will do *                                                          nothing
 *                                                          negative values will send slider the other way
 *                  lowText {string, optional}          Text to go on low button, default value is '-'
 *                  highText {string, optional}         Text to go on high button, default value is '+'
 *          OR: {array, required} args Array of objects which will be used with each div referred to by
 *                      the selector, if the length of the array is shorter than the number of divs then the
 *                      array will loop back to the beginning. For properties each object must have, see above
 *
 * @return {object} following properties
 *      movebar {function}  function to move the bar, pass the new position as the first arguement,
 *                              zoom bar will act as if it was being moved by the user
 */
module.exports = exports = function(selector, args){
    if(!args)
        args = [{}];
    else if(!Array.isArray(args))
        args = [args];
    /* standardise args */
    args.forEach(function(arg){
        arg.sliderValue = (arg.sliderValue && arg.sliderValue.call) ? /* sliderValue is defined and sliderValue is a function */
                            arg.sliderValue : function() { return ""; };
                            
        arg.change = (arg.change && arg.change.call) ? 
                        arg.change : function() { };
                        
        arg.move = (arg.move && arg.move.call) ? 
                        arg.move : function() { }; 
                                                
        arg.initialPos = arg.initialPos || 0;
        
        arg.damping    = arg.damping && arg.damping > 0 ? arg.damping : 1;
        
        arg.freq       = arg.freq    && arg.freq    > 0 ? arg.freq    : 3e-2;
        
        arg.sliderMoveTime = _.isFinite(arg.sliderMoveTime) ? arg.sliderMoveTime : 1.5;
        
        arg.vertical   = !(arg.vertical === false);
        
        arg.lowText  = arg.lowText  || '&#8210'; // minus sign, bit wider than '-'
        arg.highText = arg.highText || '+'; 
    });
    /* iterate in document order */
    $(selector).each(function(i, element){
        // NM element used instead of this as element may be a string
        // and using this would confused jquery
        
        var argi = args[i%args.length];
        var $this = $(element);
        var $top = $(document.createElement('div')).addClass('zcomp-top').text(argi.highText);
        
        var $bar = $(document.createElement('div')).addClass('zcomp-bar');
        
        var $slide = $(document.createElement('div')).addClass('zcomp-slide')
                .appendTo($bar);
        
        var $bottom = $(document.createElement('div')).addClass('zcomp-bot').html(argi.lowText); 
        
        if(argi.vertical)
            $this.append($top,$bar,$bottom);
        else
            $this.append($bottom,$bar,$top);
                    
        /* innerHeight gives height including the padding */
        var slidetop = false, 
            slidebot = false,
            
        /* max value of currentTranslate, note 1 is technically at the top of the bar, but there is a
            small overlap, because at 1 there is a white line between top/bottom of bar and slider */
            max = 1.005,
            smooth = (function(){
                
                if(argi.damping === 1) // : critically damped
                    return function(sliderpos, dt){
                        
                        var prev_actual = sliderpos.actual;
                        
                        var diff = prev_actual - sliderpos.current;
                        
                        sliderpos.actual = sliderpos.current + 
                                            ( diff + ( sliderpos.velocity + argi.freq * diff ) * dt ) *
                                            Math.exp( - argi.freq * dt );
                                            
            
                        sliderpos.velocity = (sliderpos.actual - prev_actual) / dt;
                    }
                if(argi.damping < 1) // : underdamped
                    return function(sliderpos, dt){
                        var freq_damped = argi.freq * Math.sqrt(1 - argi.damping * argi.damping);
                                                
                        var diff = sliderpos.actual - sliderpos.current;
                        
                        if(diff === 0)
                            return;
                        
                        var tan_phase = (sliderpos.velocity / diff + 
                                                 argi.damping*argi.freq 
                                                ) / freq_damped;
                        var phase = Math.atan(tan_phase);
                                                
                        var ampl  = diff / Math.cos(phase);
                        var exp   = Math.exp( - argi.damping * argi.freq * dt );
                        var cos   = Math.cos(freq_damped * dt - phase);
                        var sin   = Math.sin(freq_damped * dt - phase);
                        
                        sliderpos.actual = sliderpos.current + ampl * exp * cos;
                                                                
                        sliderpos.velocity = - ampl * exp * ( argi.damping * argi.freq * cos + freq_damped * sin );
                    }
                
                // else argi.damping > 1 : overdamped
                return function(sliderpos, dt){
                                                
                    var diff = sliderpos.actual - sliderpos.current;
                    
                    if(diff === 0)
                        return;
                    
                    // y = X + A*exp( [ -damping + q ] * freq * t ) + B*exp( [ -damping - q ] * freq * t )
                    
                    var q     = Math.sqrt(argi.damping * argi.damping - 1);
                        A     = ( diff * ( argi.damping + q) * argi.freq + sliderpos.velocity ) / ( 2 * argi.freq * q ),
                        B     = ( diff * (-argi.damping + q) * argi.freq - sliderpos.velocity ) / ( 2 * argi.freq * q ),
                        Acoe  = ( -argi.damping + q ) * argi.freq,
                        Bcoe  = ( -argi.damping - q ) * argi.freq,
                        Aexp  = A * Math.exp(Acoe * dt),
                        Bexp  = B * Math.exp(Bcoe * dt);
                        
                    
                    
                    sliderpos.actual = sliderpos.current + Aexp + Bexp;
                                                            
                    sliderpos.velocity = Aexp * Acoe + Bexp + Bcoe;
                                 
                }
                
            }).call(),
            moveSlider = function(p){
                
                
                p = (p > max ? max :
                         p < -max ? -max:
                            p) ;
                            
                var pos = argi.vertical ? p : -p;
                                
                if(pos <= -1 && !slidetop){
                    $top.addClass("swipe");
                    slidetop = true;
                }else if(pos > -1 && slidetop){
                    $top.removeClass("swipe");
                    slidetop = false;                
                }else if(pos>= 1 && !slidebot){
                    $bottom.addClass("swipe");
                    slidebot = true;
                }else if(pos < 1 && slidebot){
                    $bottom.removeClass("swipe");
                    slidebot = false;                
                }
            
                return p;
            };
            
        var startpos = argi.vertical ? moveSlider(argi.initialPos) : -moveSlider(-argi.initialPos);
        
        var sliderpos = {
            first: 0, 
            current: startpos,
            actual: startpos,
            velocity: 0
        };
        
        
        
        animate(function(controller){
            var mousey = {first: 0, current: 0};
            
            var heightAbove = ($bar.height() - $slide.innerHeight())/2,
                widthAbove  = ($bar.width() - $slide.innerWidth())/2,
                
                setcss = function(pos){
                    if(argi.vertical)
                        $slide.css('transform',
                            'translateY(' + (pos*heightAbove).toFixed() + 'px)');
                    else
                        $slide.css('transform',
                            'translateX(' + (-pos*widthAbove).toFixed() + 'px)');
                    
                    return pos;
                };
            
            
            setcss(sliderpos.actual);
            $slide.html(argi.sliderValue(sliderpos.actual/max));  
        
            var after = false;
            var mouse_on_zoom = false;
            
            var debounced = _.debounce(function(){
                
                if(!mouse_on_zoom)
                {
                    controller.start();
                    begin_after_stage();
                }
                
            }, 700);
            
            var button_movement = 0;
            
            var begin_after_stage = function(){
                
                after = true;
                
                if(!isNaN(argi.after)){
                    sliderpos.current = argi.after;
                }
                
                argi.change(sliderpos.actual / max);
            }
            
            
            var begin_button_movement = function(dir){
                
                after = false;
                controller.start();
                
                button_movement = dir * 1e-3/argi.sliderMoveTime;
            }
            var end_button_movement = function(){
                
                button_movement = 0;
            }
            
            /* botton zoom */
            $top.mousedown(begin_button_movement.bind(null,-1))
                .mouseup(end_button_movement);
                
            $bottom.mousedown(begin_button_movement.bind(null,1))
                   .mouseup(end_button_movement);
                   
                   
            // stop slider moving when it is clicked
            $slide.mousedown(end_button_movement);
            
            // prevent slider returning when mouse is inside the zoom box
            $this.mouseenter(function() { mouse_on_zoom = true; })
                 .mouseleave(function() { mouse_on_zoom = false; debounced(); })
            
            
            /* mouse wheel zoom */
            if(argi.scroll)
            {
                $(document).mousewheel(function(event){
                    
                    after = false;
                    controller.start();
                    
                    sliderpos.current = moveSlider(sliderpos.current - 0.1*event.deltaY);
                    
                    
                    debounced();
                });
            }
        
            $slide.mousedown(function(e){
                
                after = false;
                controller.start();
                                
                mousey.first = mousey.current = argi.vertical ? e.pageY : e.pageX;
                sliderpos.first = sliderpos.current;
                $('body').addClass('cursor-pointer');

                var stopmousemovement = function(){
                    $('body').removeClass('cursor-pointer');
                    $(document).off('.slidermoving');
                };
                
                var minX = $this.offset().left;
                /* offset gives position including border and padding so include these in the width */
                var maxX = minX + $this.outerWidth();
                var minY = $this.offset().top;
                /* offset gives position including border and padding so include these in the width */
                var maxY = minY + $this.outerHeight();
                
                var mousemove = argi.vertical ? 
                    function(e){
                        /* detect if mouse has left bar horizontally */
                        var x = e.pageX;
                        
                        if(x < minX || x > maxX){
                            stopmousemovement();
                        }else{
                            mousey.current = e.pageY;
                            var offset = (mousey.current-mousey.first)/heightAbove + sliderpos.first;
                            sliderpos.current = moveSlider(offset);
                        }
                    } :
                    function(e) {
                        /* detect if mouse has left bar vertically */
                        var y = e.pageY;
                        
                        if(y < minY || y > maxY){
                            stopmousemovement();
                        }else{
                            mousey.current = e.pageX;
                            var offset = (mousey.current - mousey.first)/widthAbove - sliderpos.first;
                            sliderpos.current = -moveSlider(offset);
                        }                        
                    }
                
                $(document).on({
                    'mousemove.slidermoving': mousemove,
                    'mouseup.slidermoving': stopmousemovement
                });
            });
            
            controller.bindanimate(function () {
                 
                        
                smooth(sliderpos, this.deltatime);
                
                if(button_movement)
                {
                    var distance = button_movement * this.deltatime;

                    sliderpos.current = moveSlider(sliderpos.current + distance);

                    if (Math.abs(sliderpos.current) > max)
                        sliderpos.current = max;  
                } 
/*  */              
                if(after)
                {                    
                    if(Math.abs(sliderpos.actual - sliderpos.current) < 0.001 &&
                        Math.abs(sliderpos.velocity) < 0.001 )
                            controller.stop();
                    
                }
                else
                {            
                    argi.move(sliderpos.actual/max, this.time);
                    $slide.html(argi.sliderValue(sliderpos.actual/max));
                }
                
                setcss(sliderpos.actual);
            });
        });
        
        
        /* clickable buttons for top and bottom */
        /*
        animate(function (controller) {
            $top.mousedown(function () {
                controller.start(-1/argi.sliderMoveTime);
            }).mouseup(function () {
                controller.stop();
            });
            $bottom.mousedown(function () {
                controller.start(1/argi.sliderMoveTime);
            }).mouseup(function () {
                controller.stop();
            });
            // stop slider moving when it is clicked
            $slide.mousedown(function() {
               controller.stop(); 
            });
            controller.bindanimate(function (sliderPxPerSec) {
                var distance = sliderPxPerSec * this.deltatime / 1000;

                sliderpos.current = setcss(moveSlider(sliderpos.current + distance));

                if (Math.abs(sliderpos.current) === max)
                    this.stop();

            });
        });*/
    });

    
}