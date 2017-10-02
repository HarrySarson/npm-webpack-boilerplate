var undefined;

var $ = require('jquery');
var _ = require('lodash');
var polynomial = require('./polynomial');

var origin = { x: 0.5, y: 0.5, xmax: 10, ymax: 10};

 // Convert canvas coor to coordinate centred at origin
var cvsXtoCoorX = function(x,width,zoom) {
    return (x/width - origin.x)*2*origin.xmax*zoom;
};
var cvsYtoCoorY = function(y,height,zoom) {
    return (origin.y - y/height)*2*origin.ymax*zoom;
};

var coorXtoCvsX = function(x,width,zoom) {
    return (origin.x + x/(2*origin.xmax*zoom))*width;
};
var coorYtoCvsY = function(y,height,zoom) {
    return (origin.y - y/(2*origin.ymax*zoom))*height;
};

/* define some colours */

var ColorId = function(_r, _g, _b, _a) {
    this.r = _r;
    this.g = _g;
    this.b = _b;
    this.toString = function() {
        return 'rgb(' + _r + ',' + _g + ',' + _b + ')';
    }
}

var colorPicker = {
    red: new ColorId(255, 0, 0),
    orange: new ColorId(255, 140, 0),
    yellow: new ColorId(255, 255, 0),
    green: new ColorId(0, 255, 0),
    blue: new ColorId(0, 0, 255),
    indigo: new ColorId(0, 0, 128),
    violet: new ColorId(208, 32, 144),
    white: new ColorId(0, 0, 0),
    black: new ColorId(0, 0, 0)
};

var rainbow = [colorPicker.red, colorPicker.orange, colorPicker.yellow, colorPicker.green, colorPicker.blue, colorPicker.indigo, colorPicker.violet];

var lastElement = function(arr) {
    return arr[arr.length - 1];
};

exports.getCoor = function(e, offset, width, height, z) {
    if (e.pageX) {
        return {
            x: cvsXtoCoorX(e.pageX-offset.left,width,z),
            y: cvsYtoCoorY(e.pageY-offset.top,height,z)
        }
    } else {
        return 0;
    }
};

var plot = function(canvas, context, poly, step, colorInfo, zoom) {
    
    // Set min and max for plotting
    var width = canvas.width,
        height = canvas.height,
        a = 0,
        b = width,
        lastY,
        to = 'moveTo',
        curvepos = 0, // -1 above, 0 on canvas, 1 below canvas
        clipCanvasY = function(y){
            return y < 0 ? -1 : (y > height ? 1 : 0);
        },
        tofunc = function(x,y){
            var pos = clipCanvasY(y);
            if(pos === 0){
                if(curvepos === 0){
                    context.lineTo(Math.round(x),Math.round(y)); // curve goes from inside to inside         
                }else{
                    var clipedY = (curvepos === 1 ? height : 0); // curve goes from outside to inside
                    context.moveTo(Math.round(x),clipedY);      
                    context.lineTo(Math.round(x),Math.round(y));
                }
            }else{
                if(curvepos === 0){
                    var clipedY = (pos === 1 ? height : 0);  // curve goes from inside to outside
                    context.lineTo(Math.round(x),clipedY);   
                }
            }
            curvepos = pos;
        };

    context.save();

    // Curve is made from many chords,
    context.beginPath();
    // Beginning of the chord
    lastY = coorYtoCvsY(poly.eval(cvsXtoCoorX(a,width,zoom)),height,zoom);
    var pos = clipCanvasY(lastY);
    if(pos === 0){
        context.moveTo(Math.round(0),Math.round(lastY));
    }
    curvepos = pos;

    a += step;
    
    while (a <= b) {
        var newY = coorYtoCvsY(poly.eval(cvsXtoCoorX(a,width,zoom)),height,zoom);
        if(Math.abs(newY-lastY) > 1){
            /* put an extra point in half way */
            var midY = coorYtoCvsY(poly.eval(cvsXtoCoorX(a-step/2,width,zoom)),height,zoom);
            tofunc(a-step/2,midY);                
        }
        lastY = newY;
        tofunc(a,lastY);
        a += step;
    }

    // Set colour of lines
    context.lineJoin = 'round';
    context.lineWidth = 3;
    context.strokeStyle = colorInfo + "";
    // Put to canvas
    context.stroke();
    context.restore();
};
var plotpoint = function(canvas, context, x, y, z) {
    if(!Array.isArray(x))
        x = [x];
    if(!Array.isArray(y))
        y = [y];
    var len = Math.min(x.length,y.length);
    
    var radius = Math.round(10 / Math.pow(z, 0.25));
    var diag = Math.round(radius / Math.SQRT2);
    
    var width = canvas.width, height = canvas.height;
    
    context.save();
    context.beginPath();
    for(var i = 0; i < len; ++i){
        
        var xCenter = x[i]
        var yCenter = y[i];
        if (xCenter > -width / 2 &&
            xCenter < width / 2 &&
            yCenter < height) {
                
            // plot +ve diagonal line
            context.moveTo(Math.round(coorXtoCvsX(xCenter,width,z)) - diag, Math.round(coorYtoCvsY(yCenter,height,z)) - diag);
            context.lineTo(Math.round(coorXtoCvsX(xCenter,width,z)) + diag, Math.round(coorYtoCvsY(yCenter,height,z)) + diag);

            // plot -ve diagonal line
            context.moveTo(Math.round(coorXtoCvsX(xCenter,width,z)) + diag, Math.round(coorYtoCvsY(yCenter,height,z)) - diag);
            context.lineTo(Math.round(coorXtoCvsX(xCenter,width,z)) - diag, Math.round(coorYtoCvsY(yCenter,height,z)) + diag);
        }
    }
    context.strokeStyle = 'black';
    context.lineWidth = Math.ceil(radius/5);
    context.stroke();
    context.restore();
};
var inherit = function(parent, init){
    init.prototype = Object.create(parent.prototype);
    init.prototype.constructor = init;
    init.prototype.superclass = parent;
    return init;
};

exports.Canvas = function(canvas){
    this.canvas = canvas; 
    this.context = this.canvas.getContext("2d");  

    $(document).ready(this.resizeCanvas.bind(this));
};
exports.Canvas.prototype.resizeCanvas = function() {
    var $canvas = $(this.canvas);
    this.canvas.width = $canvas.parent().width();
    this.canvas.height = $canvas.parent().height();
};
exports.Canvas.prototype.clear = function(){
    this.canvas.width = this.canvas.width;
    this.canvas.height = this.canvas.height;   
};

exports.Curve = inherit(exports.Canvas,function(canvas, colors){
    // call super class
    this.superclass(canvas);
    // these variables are not reset by reset()
    this.currentmode = '';
    this.zoom = 1;
    this.maxOrder = Infinity;
    
    if(_.isFunction(colors)){
        this.colors = colors;
    }else if(_.isArray(colors)){
        this.colors = function(i){
            return colors[i % colors.length];
        };
    }else if(colors){
        this.colors = function(){
            return colors;
        };
    }else{
        this.colors = function(i){
            return rainbow[i % rainbow.length];
        };
    }
    this.reset();
    
});

exports.Curve.origin = function() { return origin; }

exports.Curve.prototype.reset = function(){
    this.plotFrom = 0;  
    this.polyarr = [];
    this.points = {
        x: [],
        y: []
    };
};

exports.Curve.prototype.setPlotFrom = function(from){
    if(typeof from === 'number'){
        this.plotFrom = from;
    }else if(from.call){
        this.plotFrom = from.call(undefined,this.polyarr.length);
    }
}

exports.Curve.prototype.lastpoly = function(){
    return this.polyarr.length >= 1 ? this.polyarr[this.polyarr.length-1] : undefined;
},
exports.Curve.prototype.plot = function(){
    for(var i = this.plotFrom; i < this.polyarr.length; ++i){
        plot(this.canvas, this.context, this.polyarr[i], 1, this.colors(i),this.zoom);
    }
    plotpoint(this.canvas,this.context,this.points.x,this.points.y,this.zoom);
};

exports.Curve.prototype.plotLast = function(){
    // plot all points so crosses are on top
    var p = this.lastpoly();
    if(p)
        plot(this.canvas, this.context, p, 1, this.colors(this.polyarr.length-1),this.zoom);
    plotpoint(this.canvas,this.context,this.points.x,this.points.y,this.zoom);
};

exports.Curve.prototype.addclick = function(pageX, pageY){
    
    var c = exports.getCoor({pageX:pageX,pageY:pageY}, $(this.canvas).offset(), this.canvas.width, this.canvas.height, this.zoom);
    
    if (!c || c === 0) /* coordinate is invalid so ignore */
        return;
        
    var iOfx = this.points.x.indexOf(c.x);
    if (iOfx !== -1) /* there are two coordinates with same x-value */
    {  
        if (this.points.y[iOfx] === c.y) /* coordinate to be added is identical to a coordinate 
                    already in the array so ignore coordinate (so do not add it to array) */
        {
        }                        
        else /* two coordinates with same x but different y, impossible to be matched to a function of x */
        {
            
            this.addclick(pageX + Math.random()*0.1 - 0.05, pageY);
            // try again with slightly different x
        }
    }else{
        this.points.x.push(c.x);
        this.points.y.push(c.y);
        if (this.points.x.length > 1) 
        {
            var p = polynomial.createPoly({
                x: this.points.x, 
                y: this.points.y, 
                base: this.currentmode, 
                maxOrder: this.maxOrder
            });
            
            
            if (p.isValid()) {
                this.polyarr.push(p);
            } else {
                /* error creating polynomial */
                this.points.x.pop();
                this.points.y.pop();
            }
        }
    }
};
exports.Curve.prototype.repopulate = function(){
    var self = this;
    for(var i = 1; i < self.points.x.length; ++i){
        self.polyarr[i-1] = polynomial.createPoly({
                x: this.points.x, 
                y: this.points.y, 
                base: this.currentmode, 
                length: i+1,
                maxOrder: this.maxOrder
            });
    }
};

exports.Curve.prototype.currentMaxOrder = function() {
    
    return this.points.x.length > 0 ? this.points.x.length - 1 : null;
    
}

  















