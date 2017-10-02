var undefined;

var msup = function(base,exponent,attr){
    attr = attr || '';
    return '<msup' + attr + '>' + base + exponent + '</msup>'
}
var mfrac = function(numerator,denumerator,attr){
    return '<msup' + attr + '>' + base + exponent + '</msup>'
}

var mi = function(i,attr){
    attr = attr || '';
    return '<mi' + attr + '>' + i + '</mi>'
}
var mn = function(n,attr){
    attr = attr || '';
    return '<mn' + attr + '>' + n + '</mn>'
}
var mo = function(o,attr){
    attr = attr || '';
    return '<mo' + attr + '>' + o + '</mo>'
}