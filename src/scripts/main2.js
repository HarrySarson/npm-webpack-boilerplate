var undefined;

var $ = require('jquery');
var _ = require('lodash');
var MJ = require('mathjax');

MJ.Hub.Config({
  MMLorHTML: {
    prefer: {
      Firefox: "MML"
    }
  }
});

/* tanh polyfill, better than mdn's one as it tends to 1 for large x rather than producing NaN, 
                also less calls to Math.exp */
Math.tanh = Math.tanh || function(x) {
    eminus2x = Math.exp(-2*x);
    return (1 - eminus2x) / (1 + eminus2x);
}
var UI = require("./ui.js");
var curve_ui = new UI.Curve($('#plottedCanvas')[0]);
var extra_ui = new UI.Curve($('#extraCanvas')[0],'#aaa');

var copyaccross = function(from, to, arr){
    arr.forEach(function(prop){
       to[prop] = from[prop];
    });
}
/* FINISH UPDATES TO POLYNOMAIL */

var scale = {
    lastzoom: 0,
    change: function(pos) {
        if(!this.lastzoom){
            copyaccross(curve_ui, extra_ui, ['plotFrom','polyarr','points','zoom']);
            extra_ui.clear();
            extra_ui.replot();
        }
        extra_ui.zoom = Math.pow(10,pos);
        if(this.lastzoom != extra_ui.zoom){
            requestAnimationFrame(function(){
                extra_ui.clear();
                extra_ui.replot();
            });
            $('#log2').text(this.lastzoom + '/' + extra_ui.zoom);
        }     
        this.lastzoom = extra_ui.zoom;   
    },
    finalise: function(pos){
        this.lastzoom = 0;
        curve_ui.zoom = Math.pow(10,pos);
        requestAnimationFrame(function(){
            extra_ui.clear();
            curve_ui.clear();
            curve_ui.replot();
        });
    }
};

var zoombar = require("./zoom.js")($('.zoom-1'),{
    sliderValue: function(pos){
        return "x" + ((11 - 9*pos)/2).toFixed(1);
    },
    move: function(pos){
        scale.change(pos);
    },
    change: function(pos){
        scale.finalise(pos);
    },
    // initial sliderValue = 5
    initialPos: 0//1.0/9
});

var menu = require("./menu/menu.js");
var lsm = require("./local_storage_manager.js");

var input = require("./keyboard_input.js");



var run = function(f){
    return f && f();
}

password = function(length){
    var s = [];
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for(var i = 0; i < length; ++i){
        s.push(chars[Math.floor(Math.random()*chars.length)]);
    }
    return s.join("");
}

var keyboard = new input();

keyboard.on('Show', function(){
    $('.viewer').removeClass('hidden');
    $('.shower').removeClass('minified');
    setTimeout(function(){
        $('.viewer').removeClass('minified');
    },10);
    if(hideid){
        clearTimeout(hideid);
        hideid = 0;
    }
});

var hideid;
keyboard.on('Hide', function(){
    $('.viewer').addClass('minified');
    $('.shower').addClass('minified');
    hideid = setTimeout(function(){
        $('.viewer').addClass('hidden');
        hideid = 0;
    }, 1100);
});
keyboard.on('Toggle Menu', function(data){
    if($('.viewer').hasClass('minified'))
       this.emit('Show',data);
    else
       this.emit('Hide',data);
});

var cancelmodehide;
keyboard.on('Select Mode', function(){
    if($('#modeSelect').hasClass('faded')){
        cancelmodehide = true;
        $('#modeSelect').removeClass('hidden');
        $('#modeSelect').removeClass('faded');
    }else{
        $('#modeSelect').addClass('faded');
        cancelmodehide = false;
        setTimeout(function(){
            if(!cancelmodehide)
                $('#modeSelect').addClass('hidden');
        },/*$modes-hide-time*1000*/1000);
    }
});

keyboard.on('Reset',function(){
    curve_ui.clear();
    curve_ui.reset();
});

keyboard.on('Resize',function(){
    curve_ui.resizeCanvas();
});

keyboard.bindKeyPress('body',[{
 characters: '\n',
 emit: 'Toggle Menu',
 preventDefault: true
},{
 characters: ' ',
 emit: 'Select Mode',
 preventDefault: true    
}]);


/**/
var modes = {
    'Polynomial': {
        
    },
    'Exponential':{
        'yfunc': function(y) {
            return Math.log(y);
        },
        'yinverse': function(y) {
            return Math.exp(y);
        },
        'yInverseStrFunc': function(str) {
            return "y = e^(" + str + ")";
        },
        'yInverseMathMLFunc': function(str) {
            var s =
                "<mi>y</mi>\
                <mo>=</mo>\
                <msup>\
                    <mi>e</mi>\
                    <mrow>" + str + "</mrow>\
                </msup>";
            return s;
        },
        'adaptionFunc': function(poly) {
            return poly;
        }
    },
    'Exponential 2':{
        xfunc: function(x) {
            return Math.exp(x);
        },
        xStrFunc: function(index) {
            return index == 1 ? "e^x" : "e^" + index + "x";
        },
        xMathMLFunc: function(index) {
            return (index === 1) ? 
                "<msup>\
                    <mi>e</mi>\
                    <mi>x</mi>\
                </msup>"
                :
                "<msup>\
                    <mi>e</mi>\
                    <mrow>\
                        <mn>" + index + "</mn>\
                        <mi>x</mi>\
                    </mrow>\
                </msup>";
        }
    },
    'Absolute Values':{
        xfunc: function(x) {
            return Math.abs(x);
        },
        xStrFunc: function(index) {
            return "|x|" + (index == 1 ? "" : "^" + index);
        },
        xMathMLFunc: function(index) {
            return (index === 1) ? 
                "<mfenced open='|' close='|'>\
                    <mi>x</mi>\
                </mfenced>"
                :
                '<msup>\
                    <mrow>\
                        <mo>&#x2223;</mo>\
                        <mi>x</mi>\
                        <mo>&#x2223;</mo>\
                    </mrow>\
                    <mn>' + index + "</mn>\
                </msup>";
        }
    },
    'Rational':{
        xfunc: function(x) {
            return (x*x)/(x*x+1);
        },
        xStrFunc: function(index) {
            return "1/(1+x)" + (index == 1 ? "" : "^" + index);
        },
        xMathMLFunc: function(index) {
            return (index === 1) ? 
                "<mfrac>\
                    <mn>1</mn>\
                    <mfenced>\
                        <mrow>\
                            <mn>1</mn>\
                            <mo>+</mo>\
                            <mi>x</mi>\
                        </mrow>\
                    </mfenced>\
                </mfrac>"
                :
                "<mfrac>\
                    <mn>1</mn>\
                    <msup>\
                        <mfenced>\
                            <mrow>\
                                <mn>1</mn>\
                                <mo>+</mo>\
                                <mi>x</mi>\
                            </mrow>\
                        </mfenced>\
                        <mn>" + index + "</mn>\
                    </msup>\
                </mfrac>";
        }
    }
}
 
var M_currentmode;

var currentmode = function(mode){
    if(modes[mode] !== undefined){
        M_currentmode = mode;
        curve_ui.currentmode = modes[mode];
        document.title = "Curve Plotter: " + M_currentmode;
        lsm.setItem('mode',M_currentmode);
    }
    return M_currentmode;
}

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
            return '';
        }
        return newmode;
    }else{
        return '';
    }
    
}));
 
var topmenu = menu('#menuOptions').animate(function(event){
    var txt = $(event.currentTarget).text();
    keyboard.emit(txt);
});

var modeselect = menu('#modeSelect',{width:2})
    .add('Polynomial') // put Polynomial first
    .add(_.without(Object.keys(modes).sort(),'Polynomial'))
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
    
var showmenu = menu('#showmenu').animate(function(event){
    var txt = $(event.currentTarget).text();
    keyboard.emit(txt);
});
