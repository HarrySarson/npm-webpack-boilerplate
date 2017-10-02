
var scss = {
    'max-width': '775px'
};

var $ = require('jquery');
var _ = require('lodash');

var MJ = require('mathjax'); // stored as global variable MathJax

if(_.isEmpty(MJ))
    MJ = MathJax;

require('browsernizr/test/css/transitions');
var modern = require('browsernizr');

require('./polyfill/requestanimationframe.js');


var UI = require("./ui.js");

var mathOutputId = '#math-output';

var tag = function(opentag/* [, content0, content1, content2, ...*/){
    if(!opentag) return '';
    
    var endtag = _.words(opentag)[0];
    var content = '';
    
    for(var i = 1, len = arguments.length; i < len; ++i){
        content += arguments[i];
    }
    
    return '<' + opentag + '>' + content + '</' + endtag + '>';
};

MJ.Hub.Config({
  MMLorHTML: {
    prefer: {
      Firefox: "MML"
    }
  },
  messageStyle: 'none'
});

/* tanh polyfill  */
Math.tanh = Math.tanh || function(x) {
    var eminus2x = Math.exp(-2*x);
    return (1 - eminus2x) / (1 + eminus2x);
};
/* sinh polyfill  */
Math.sinh = Math.sinh || function(x) {
    return 0.5 * (Math.exp(x) - Math.exp(-x));
};
/* ashinh polyfill */
Math.asinh = Math.asinh || function(x) {
  if (x === -Infinity) {
    return x;
  } else {
    return Math.log(x + Math.sqrt(x * x + 1));
  }
};
Math.atanh = Math.atanh || function(x) {
  return Math.log((1+x)/(1-x)) / 2;
};

var run = function(f,thisarg,params){
    return f && f.apply && f.apply(thisarg,params);
};

window.password = function(length){
    var s = [];
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for(var i = 0; i < length; ++i){
        s.push(chars[Math.floor(Math.random()*chars.length)]);
    }
    return s.join("");
};


var curve_ui = new UI.Curve($('#plottedCanvas')[0], 
    run(function(r,g,b){
        var curveColors = [];
        
        var push = function(){
            
            var red = 256*Math.random(),
                green = 256*Math.random(),
                blue = 256*Math.random();
            r = _.isNumber(r) ? r : red;
            g = _.isNumber(g) ? g : green;
            b = _.isNumber(b) ? b : blue;
            
            // mix the color
            
            red   = (red   + r) / 2;
            green = (green + g) / 2;
            blue  = (blue  + b) / 2;
            var c = 'rgb(' + red.toFixed() + ',' + green.toFixed() + ',' + blue.toFixed() + ')';
            curveColors.push(c); 
            return c;
        };
        
        return function(i){
            if(i < curveColors.length)
                return curveColors[i];
            else
                return push();
        };
    },undefined,[255, 68, 34])
);


/**/
var modes = {
    'Polynomial': {
        
    },
    'Hyperbolic':{
        yfunc: function(y) {
            return Math.asinh(y);
        },
        yinverse: function(y) {
            return Math.sinh(y);
        },
        yInverseStrFunc: function(str) {
            return "y = sinh(" + str + ")";
        },
        yInverseMathMLFunc: function(str) {
            var s = tag('math xmlns="http://www.w3.org/1998/Math/MathML"',
                        tag('mi','y') +
                        tag('mo','=') +
                        tag('mrow',
                            tag('mi', 'sinh') +
                            tag('mfenced', 
                                tag('mrow',str)
                            )
                        )
                    );
            return s;
        }
    },
    'Exponential': {
        xfunc: function(x) {
            return Math.exp(x);
        },
        xStrFunc: function(index) {
            return index == 1 ? "e^x" : "e^(" + index + "x)";
        },
        xMathMLFunc: function(index) {
            return (index === 1) ? 
                tag('msup',
                    tag('mi','e'),
                    tag('mi','x')
                )
                :
                tag('msup',
                    tag('mi','e'),
                    tag('mrow',
                        tag('mn', index),
                        tag('mi','x')
                    )
                );
        }
    },
    'Squares':{
        xfunc: function(x) {
            return x*x;
        },
        xStrFunc: function(index) {
            return (index === 1) ? "tanhx" : "tanh^" + index + "(x)";
        },
        xMathMLFunc: function(index) {
            return tag('msup',
                        tag('mi','x') +
                        tag('mn',index*2)
                    );
        }
    },
    Tanh:{
        xfunc: function(x) {
            return Math.tanh(x);
        },
        xStrFunc: function(index) {
            return "x^" + (2*index);
        },
        xMathMLFunc: function(index) {
            return (index === 1) ? 
                tag('mi', 'tanh') +
                tag('mfenced',
                    tag('mi','x')
                ) :
                tag('msup',
                    tag('mi', 'tanh') +
                    tag('mn', index)
                ) + 
                tag('mfenced',
                    tag('mi','x')
                );
        }
    },
    'Rational':{
        xfunc: function(x) {
            return (x*x)/(1+x*x);
        },
        xStrFunc: function(index) {
            return "x^" + (2*index) + "/(1+x^2)^" + (index);
        },
        xMathMLFunc: function(index) {
            return (index === 1) ? 
                '<mfrac>' + 
                    '<mn>1</mn>' + 
                    '<mfenced>' + 
                        '<mrow>' + 
                            '<mn>1</mn>' + 
                            '<mo>+</mo>' + 
                            '<mi>x</mi>' + 
                        '</mrow>' + 
                    '</mfenced>' + 
                '</mfrac>'
                :
                '<mfrac>' + 
                    '<mn>1</mn>' +
                    '<msup>' + 
                        '<mfenced>' + 
                            '<mrow>' + 
                                '<mn>1</mn>' + 
                                '<mo>+</mo>' + 
                                '<mi>x</mi>' + 
                            '</mrow>' + 
                        '</mfenced>' + 
                        '<mn>' + index + '</mn>' +
                    '</msup>'
                '</mfrac>';
        },
        xMathMLFuncWithCoeff:function(sign, coeff,index) {
            return sign + 
                tag('mfrac',
                    tag('mrow',
                        coeff + 
                        tag('msup',
                            tag('mi', 'x') +
                            tag('mn', 2*index)
                        )
                    ) +
                    tag('msup',
                        tag('mfenced',
                            tag('mrow',
                                tag('mn',1) +
                                tag('mo','+') +
                                tag('msup',
                                    tag('mi','x') + 
                                    tag('mn',2)
                                )
                            )
                        ) +
                        tag('mn', index)
                    )
                );
        }
    }
};

var lsm = require("./local_storage_manager.js");

var replot = function(){
    /* clear canvas */
    curve_ui.clear();

    // fill array of graphs
    curve_ui.repopulate();
    
    // Plot points                    
    curve_ui.plot();
    var p = curve_ui.lastpoly();
    if(p)
        mathjax(p.toMathML(3));
}

var currentmode = function(mode){
    if(modes[mode] !== undefined && modes[mode] != curve_ui.currentmode){
        curve_ui.currentmode = modes[mode];
        document.title = "Curve Plotter: " + mode;
        lsm.setItem('mode',mode);
        /* replot canvas */
        requestAnimationFrame(replot);
    }
    return curve_ui.currentmode;
};

currentmode(run(function(){
    var stored = lsm.getItem('mode');
    if(stored){
        var newmode;
        _.forOwn(modes,function(value,key){
           if(key === stored){
                newmode = stored;
                return false;
           }           
        });
        if(!newmode){
            console.log("The Stored Mode cannot be recognised, using 'Polynomial' instead");
            return 'Polynomial';
        }
        return newmode;
    }else{
        return '';
    }
    
}));

var menu = require("./menu/menu.js");

var topMenu = menu('#menuOptions')
                .animate(function(event){
                    var txt = $(event.currentTarget).text();
                    keyboard.emit(txt);
                }),
                
    maxOrder = menu('#maxOrder')
                .animate(),

    modeMenu = menu('#modeSelect',{width:2})
                .add('Polynomial') // put Polynomial first
                .add(function(arr){
                        arr = _.without(Object.keys(modes).sort(),'Polynomial');
                        if(arr.length % 2 === 0) // length is even number + Polynomial box, odd number of boxes so add extra (empty) box
                            arr.push("");  // when empty box clicked, corresponding mode will not be found so nothing will happen
                        return arr;
                    }.call(undefined, modes))
                .animate(function(event){
                    var txt = $(event.currentTarget).text();
                    _.forOwn(modes,function(value,key){
                       if(key === txt){
                            keyboard.emit('Select Mode');
                            currentmode(txt);
                            return false;
                       }           
                    });
                });
    


var lastonly = false;
 
var mathjax = function(mathml){
    $(mathOutputId).html(mathml)
        .each(function(i,el){
            MJ.Hub.Queue(
                ["Typeset", MJ.Hub, el]
            );
    });  
};

/* watch mouse click on canvas, and put points */
$('#plottedCanvas').click(function(e){
    
    curve_ui.addclick(e.pageX,e.pageY);
    
    requestAnimationFrame(function(){
        if(lastonly){
            curve_ui.clear();
            curve_ui.setPlotFrom(function(len){
                return Math.max(len-1, 0);
            }); 
        }
        curve_ui.plotLast();
    });
    var p = curve_ui.lastpoly();
    if(p)
        mathjax(p.toMathML(3));
});

var ndigits = function(num, digits){
    var abs = Math.abs(num);
    
    if(abs < 1){
        return num.toFixed(digits-1);
    }else if(abs < 1000){
        return num.toPrecision(digits);
    }else{
        return num.toExponential(0);
    }
    
};

/* as mouse moves, update coordinates */
$(document).mousemove(function(event) {
    var c = UI.getCoor(event, $(curve_ui.canvas).offset(), curve_ui.canvas.width, 
                    curve_ui.canvas.height, curve_ui.zoom);
    if (c) {
        $('.coorX').text(ndigits(c.x,3));
        $('.coorY').text(ndigits(c.y,3));
    }
});
var copyaccross = function(from, to, arr){
    arr.forEach(function(prop){
       to[prop] = from[prop];
    });
};



(function(){

    var zoom = require("./zoom.js");
    var lastpos, 
        vel, 
        lasttime = 0,
        lambda   = 1e-2,
        
        previous_zoom = 0,
        zoom_pow      = 25,
        fiddle_amount = Math.tanh(2.5);
    
    var fiddlefactor = function(pos){
        
        var x = Math.max(-1, Math.min(1, pos)) * fiddle_amount;
                
        return Math.atanh( x ) + previous_zoom;
    };
        
    var scale = {
        lastzoom: 0,
        poszoom: function(pos){
                   
            return Math.pow(zoom_pow,fiddlefactor(pos));
        },
        change: function(pos) {
            curve_ui.zoom = this.poszoom(pos);
            if(this.lastzoom != curve_ui.zoom){
                requestAnimationFrame(function(){
                    curve_ui.clear();
                    curve_ui.plot();
                });
            }       
            this.lastzoom = curve_ui.zoom;       
        },
        finalise: function(pos){
            scale.change(pos);
            previous_zoom = fiddlefactor(pos);
        }
    };


    zoom(['.zoom-1', '.zoom-order'],[
    {        
        sliderValue: function(pos){
            return  (-10*fiddlefactor(pos)).toFixed(1);
        },
        move: function(pos, time){
            scale.change(pos);
            
            var dt = time-lasttime;
            vel = (pos-lastpos)/dt;
            lastpos = pos;
            lasttime = time;
            
            var acc = lambda * ( 2*vel + lambda*pos );
            
            return pos + vel*dt + acc*dt*dt;          
        },
        change: function(pos){
            scale.finalise(pos);
        },
        after: 0,
        scroll: true
    },
    {     
        move: function(pos, time){
             
            var n = (1.06 - pos)*10, s;
            
            if(n >= 30)
            {
                n = Infinity;
                s = '&infin;';
            }
            else
            {
                n = Math.round(n);
                s = n.toFixed();
            }  
            var cmo = curve_ui.currentMaxOrder();
            if(n != curve_ui.maxOrder)
            {
                if(cmo)
                {
                    var need_change = cmo > n || 
                                        (cmo <= n && cmo >  curve_ui.maxOrder);  
                    curve_ui.maxOrder = n;
                    if(need_change)
                        replot();
                }
                
                $('#orderDisplay').html(s);
            }
        },
        initialPos: -curve_ui.maxOrder/10 - 1.06, 
        vertical: false
    }
    ]);

}).call();





var KeyboardInput = require("./keyboard_input.js");
var keyboard = new KeyboardInput();

require('./polyfill/matchmedia.js');
var eq = require('./lib/enquire.js');
    
var menu_on_normally = !$('.viewer').hasClass('minified');

var hideMenu = function(){
    $('.viewer').addClass('minified');
    if(!modern.csstransitions){
        $('.viewer').addClass('hidden');
    }
};

var showMenu = function(){
    $('.viewer').removeClass('hidden');
    setTimeout(function(){
        $('.viewer').removeClass('minified');
    },10);  
};

    
eq.register('screen and (max-width: ' + scss['max-width']  + ')', {
    match: function(){ 
        hideMenu();
        $('.shower').removeClass('minified');
        setTimeout(function(){
            $('.shower').addClass('hidden');
            $('.viewer').addClass('hidden');
        }, 1000);
    },
    unmatch: function(){
        if(menu_on_normally)
            showMenu();
        else
        {
            $('.shower').addClass('minified');
        }
            
        $('.shower').removeClass('hidden');
    }
});
    

// don't forget that animationend != transitionend
$('.shower').on('transitionend webkitTransitionEnd',function(){
    $('.viewer.minified').addClass('hidden');
});

keyboard.on('Menu', function(){
    
    $('.shower').removeClass('hidden minified');
    showMenu();
    menu_on_normally = true;
    
}).on('Hide', function(){
    
    $('.shower').addClass('minified');
    hideMenu();
    menu_on_normally = false;
    
}).on('Toggle Menu', function(data){
    
    if($('.viewer').hasClass('minified'))
       this.emit('Menu',data);
    else
       this.emit('Hide',data);
   
}).on('Only Last Curve', function(){
    
    lastonly = !lastonly;
    curve_ui.clear();
    if(lastonly){
        curve_ui.setPlotFrom(function(len){
            return len-1;
        }); 
        curve_ui.plotLast();
    }else{
        curve_ui.setPlotFrom(0); 
        curve_ui.plot();
    }
    
}).on('Select Mode', function(){
    
    maxOrder.hide();
    modeMenu.toggle();
    
}).on('Order', function(){
    
    modeMenu.hide();
    maxOrder.toggle();

}).on('Reset', function(){

    curve_ui.clear();
    curve_ui.reset();
    $(mathOutputId).empty();
    
}).on('Resize', function(){

    curve_ui.resizeCanvas();
    curve_ui.plot();
    
}).bindKeyPress('body',
    [{
     characters: '\n',
     emit: 'Toggle Menu',
     preventDefault: true
    },{
     characters: ' ',
     emit: 'Select Mode',
     preventDefault: true    
    }]);


var showmenu = menu('#showmenu').animate(function(event){
    var txt = $(event.currentTarget).text();
    keyboard.emit(txt);
});

var changeWithoutTransition = function($el, func){

    $el.addClass('notransition');               // Disable transitions
    func.call($el);
    $el[0].offsetHeight;                        // Trigger a reflow, flushing the CSS changes
    $el.removeClass('notransition');            // Re-enable transitions
}

var animate = require('./animate.js');
animate(function(){

    var oldWidth  = null,
        oldHeight = null,
        newWidth  = null,
        newHeight = null;

    var shorttime = _.throttle(function(e){
    
        newWidth = $(e.currentTarget).width();
        newHeight = $(e.currentTarget).height();
        
        $('.viewer, canvas').css('transform', 'scale(' + newWidth/oldWidth + ',' + newHeight/oldHeight  + ')');
    }, 100);
    
    var longtime = _.throttle(function(e){
    
        curve_ui.resizeCanvas();
        curve_ui.plot();
        
        oldWidth = null;
        oldHeight = null;
        changeWithoutTransition($('.viewer, canvas'), function(){
            this.css('transform', '');
        });
        
        if(newWidth && newHeight)
            $('.viewer').css({
                'height': newHeight,
                'width':  newWidth
            });
            
        
    }, 500);

    $(window).resize(function(e){
        
        oldWidth = oldWidth || $(e.currentTarget).width();
        oldHeight = oldHeight || $(e.currentTarget).height();
        
        shorttime(e);
        longtime(e);
        
        
    });
    
    
});

