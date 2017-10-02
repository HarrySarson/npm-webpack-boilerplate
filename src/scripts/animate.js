require('./polyfill/performance-now.js');
require('./polyfill/requestanimationframe.js');

var callable = function(fun){
    return fun && fun.call;
};
var applicable = function(fun){
    return fun && fun.apply;
};
var undefined;

 /**
     * Binds callback to the event, the this arguement of each callback will be set to the 
     * keyboard_input object if and when the callback is called.
     * The call back will be called when emit() is called with the parameter event the same
     * as the event the callback is bound to by this method
     *
     * @memberOf animate
     * @param {function} (optional) trigger First argument is a function that is used to control animation,
     *                              The function is passed as an argument a 'controller' object used to start and
     *                              stop animation, in the function 'this' is bound to the 'controller' object
     *                              The 'controller' obect has these properties:
     *
     *                                  bindanimate(callback): pass a callback to this function, the callback
     *                                      will be called repeated during the animation, any arguments
     *                                      passed to start() are passed to animationFunc. 'this' is bound to an object 
     *                                      containing the following properties:
     *                                          time: time in milliseconds since animation started (start called)
     *                                          deltatime: time since last call to animationFunc in milliseconds
     *                                          stop: a function that can be called to stop animation 
     *                                      bindanimate will return the object bound to 'this' in trigger
     *
     *                                  bindfinish(callback): pass a callback that will be called when animation ends, 
     *                                      when callback is called this and the arguments passed to the callback
     *                                      will be same as those passed to animationFunc.
     *                                      bindfinish will return the object bound to 'this' in trigger
     *
     *                                  start: function to start animation, all arguments passed to start
     *                                      are passed to animationFunc every time it is called.
     *                                      If start is called when the animation is already running the animation
     *                                      will continue to run, and the arguments passed to start the second
     *                                      time will now be past to animation function, finish callbacks are not called
     *
     *                                  restart: stops animation (finish callbacks are called) then immediately restarts animation
     *
     *                                  stop: function to stop animation, note animation will not stop immediately,
     *                                      After animaion has stopped any functions passed to bindfinish() will be called
     *                                                      
     *                                  animating: function that returns whether or not animation is running
     *                                              
     *                                  If the trigger argument is omitted, then function returns an object identical to the one
     *                                  that would be passed to the trigger function. If trigger is supplied then the value returned
     *                                  by trigger is returned by animate
     *                                  
     *
     *                                      
     * @returns {Object} Returns the return value of trigger
     * @example
     *
     *  animate(function(controller){
     *       var car = { position: 0; }
     *       $top.mousedown(function(){
     *           controller.start(-0.01);
     *       }).mouseup(function(){
     *           controller.stop();
     *       });
     *       $bottom.mousedown(function(){
     *           controller.start(0.01);
     *       }).mouseup(function(){
     *           controller.stop();
     *       });
     *       controller.bindanimation(function(speed){
     *          var distance = speed * this.deltatime;
     *        
     *          car.position += distance;
     *       
     *          if(Math.abs(car.position) > 10)
     *              this.stop();
     *       }).bindfinish(function(){
     *          console.log('finished');
     *       });
     *  });
     *
     *  // alternatively
     *  var controller = animate();
     *  ...
     *
     */
module.exports = function(trigger,animFunc,finishFunc){
    
    var animation = applicable(animFunc) ? [animFunc] : [];
    var finish = applicable(finishFunc) ? [finishFunc] : [];
    
    var cont = false,
        animating = false,
        restart = false,
        args = [],
        
        stop = function(){
            cont = false;
        },
        thisarg = {
            time: 0,
            starttime: 0,
            deltatime: 0,
            stop: stop
        },
        a = function(){
            
            var lasttime = thisarg.time;
            thisarg.time = performance.now() - thisarg.starttime;
            thisarg.deltatime = thisarg.time - lasttime;
            if(cont){
                requestAnimationFrame(a);
                animation.forEach(function(fun){
                    fun.apply(thisarg,args);
                });
            }else{
                animating = false;
                finish.forEach(function(fun){
                    fun.apply(thisarg,args);
                });
                if(restart){
                    start.apply(undefined,restart);
                }
            }
        },        
        start = function(){
            /* start animation */
            cont = animating = true;
            restart = false;
            thisarg.time = 0;
            thisarg.starttime = performance.now();
            requestAnimationFrame(a);
        };
        
    
    var controller = {
        stop: stop,
        animating: function() { return animating; },
        start: function(){
            args = arguments;
            if(!animating) { start(); }
        },
        restart: function(){
            if(animating){
                /* animation has been previously started and not
                    yet stopped */
                restart = arguments;
                stop();                    
            }else{ 
                args = arguments;
                start(); 
            }
        },
        bindanimate: function(callback){
            if(applicable(callback))
                animation.push(callback);
            return this;
        },
        bindfinish: function(callback){
            if(applicable(callback))
                finish.push(callback);
            return this;
        }
    };
    if (trigger === undefined)
        return controller;
    else if (callable(trigger))
        return trigger.call(controller, controller);
    else
        throw new TypeError('Argument trigger is defined but is not a function');
};






