var $ = require('jquery');

var createPolyLib = function() {
    var p = {};

    var standardBase = {
        /* function called when the Polynomial object is created, this is bound to the
            polynomial object */
        ctor: function() {
            // this.problems = 99
        },
        xfunc: function(x) {
            return x;
        },
        yfunc: function(y) {
            return y;
        },
        yinverse: function(y) {
            return y;
        },
        xStrFunc: function(index) {
            return (index === 1) ? "x" : "x^" + index;
        },
        yInverseStrFunc: function(str) {
            return "y = " + str;
        },
        xMathMLFunc: function(index) {
            return (index === 1) ? "<mi>x</mi>" :
                "<msup>\
                    <mi>x</mi>\
                    <mn>" + index + "</mn>\
                </msup>";
        },
        /* special function is more formatting is needed, if coeff == 0 then no function is called,
            if this function is defined then xMathMLFunc is ignored and need not be defined.
            When the coefficient = 1, the function will pass an empty string for coeff, the function may need to text for this
            -sign is passed as a string either '<mo>-</mo>' or '<mo>+</mo>' or '' if term is first so no sign needed
            -coeff is passed as a string, already process in standard form
            -index will be an integer >= 1
            example function: 
            function(sign, coeff,index) {
                return sign + coeff + ((index === 1) ? "<mi>x</mi>" :
                    "<msup>\
                        <mi>x</mi>\
                        <mn>" + index + "</mn>\
                    </msup>");
            },           
            */
        xMathMLFuncWithCoeff: 0, // key is set but !!bases[xMathMLFuncWithCoeff] is false
        /* this function must wrap the expression in <math></math> tags! */
        yInverseMathMLFunc: function(str) {
            return '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>y</mi><mo>=</mo><mrow>' + str + "</mrow></math>";
        },
        adaptionFunc: function(poly) {
            return poly;
        }
    };
    
    p.getBaseFunc = function(func, base) {
        if (typeof base === "undefined")
            base = standardBase;
        return base[func] || standardBase[func];
    };
    /**
     * returns a string form of the polynomial in the form y = yInverseStrFunc( polynomial( xstrFunc(x) ) )
     * arguments: poly => polynomial to create string from
     *            xStrFunc        => function that takes as an argument the index (index given will be a positive integer >= 1) and returns a
     *                               string that represents the variable or function the polynomial is in.
     *                               e.g. for polynomial in sinx (y = a*sin^3(x) + b*sin^2(x) + c*sinx + d), 
     *                                xStr = function(i){
     *                                  return (i===1) ? "sinx" : "sin^" + i + "(x)";
     *                                }
     *            yInverseStrFunc => functions that takes as an argument a string representing the polynomial and
     *                               returns a string representing the value of y at a given point x
     *            prec            => the required precision of the coefficients integer > 3
     *   
     */

    var removeTrailingZeros = function(string) {
        var i = 0;
        while (string[string.length - 1 - i] === '0' || string[string.length - 1 - i] === '.') {
            ++i;
        }
        return string.substring(0, string.length - i);
    };

    var formatFloat = function(num, prec) {
        var abs = Math.abs(num);
        if (abs >= 1e6 || abs <= 1e-3) {
            return num.toPrecision(prec);
        } else {
            /* parseFloat prevents extra 0's being added to number after decimal point */
            return removeTrailingZeros(num.toPrecision(prec));
        }
    };

    var removeUnit = function(n, prec, includeSign) {
        switch (n) {
            case 1:
                return includeSign ? "+" : "";
            case -1:
                return "-";
            default:
                return ((n > 0 && includeSign) ? "+" : "") + formatFloat(n, prec);
        }
    };

    var createStringOutput = function(poly, xStrFunc, yInverseStrFunc, prec) {
        // special case where polynomial has only constant term
        if (poly.order() === 0) {
            // todo, make this into one number
            return yInverseStrFunc(poly.coeffs[0].toPrecision(prec));
        }

        var str = "";
        // first (highest index) term in polynomial
        if (poly.order() > 0 && poly.coeffs[poly.order()] !== 0)
            str += removeUnit(poly.coeffs[poly.order()], prec) + xStrFunc(poly.order());
        // other terms in polynomial (except constant term)
        for (var i = poly.order() - 1; i >= 1; --i) {
            if (poly.coeffs[i] !== 0)
                str += removeUnit(poly.coeffs[i], prec, true) + xStrFunc(i);
        }
        // constant term
        if (poly.coeffs[0] !== 0)
            str += ((poly.coeffs[0] > 0) ? "+" : "") + formatFloat(poly.coeffs[0], prec);
        return yInverseStrFunc(str);
    };


    var log10 = Math.log10 || function(x) {
        return Math.log(x) / Math.LN10;
    };

    var formatMathMLFloat = function(num, prec) {
        /* must be positive */
        if (num >= 1e6 || num <= 1e-3) {
            var sArr = num.toExponential(prec - 1).split("e");
            var s =
                "<mn>" + removeTrailingZeros(sArr[0]) + '</mn>\
                <mpadded width="-5px" lspace="-2.5px">\
                    <mo>&times;</mo>\
                </mpadded>\
                <msup>\
                    <mn>10</mn>' +
                    (sArr[1][0] === "-" ? "<mrow><mo>-</mo><mn>" + sArr[1].substring(1) + "</mn></mrow>" : "<mn>" + sArr[1].substring(1) + "</mn>") +
                "</msup>";
            return s;
        } else {
            var DegitsToLeftOfDecimal = (num === 0 ? 1 : Math.ceil(log10(num)));
            return "<mn>" + removeTrailingZeros(num.toFixed(Math.max(prec - DegitsToLeftOfDecimal, 0))) + "</mn>";
        }
    };

    var getSign = function(n) {
        return "<mo>" + (n > 0 ? "+" : "-") + "</mo>";
    };

    var getSignML = function(n, opt) {
        opt = opt || {};
        return (opt.alwaysIncludeSign || n < 0) ? getSign(n) : "";
    };
    var getAbsNumberML = function(n, prec, opt) {
        var n = (Math.abs(n));
        opt = opt || {};
        return (n === 1 && opt.removeUnit) ? "" : formatMathMLFloat(n, prec);
    };
    var getNumberML = function(n, prec, opt) {
        return getSignML(n,opt) + getAbsNumberML(n,prec,opt);
    };

    var createMathMLOutput = function(poly, xMathMLFunc, xMathMLFuncWithCoeff, yInverseMathMLFunc, prec) {
        // special case where polynomial has only constant term
        if (poly.order() === 0) {
            // todo, make this into one number
            return yInverseMathMLFunc(getNumberML(poly.coeffs[0].toPrecision(prec), prec, {}));
        }
        xMathMLFuncWithCoeff = xMathMLFuncWithCoeff && xMathMLFuncWithCoeff.call ? xMathMLFuncWithCoeff :
                function(sign, coeff, index){
                    return sign + coeff + xMathMLFunc(index);
                };
        var str = "";
        // first (highest index) term in polynomial
        if (poly.order() > 0 && poly.coeffs[poly.order()] !== 0)
            str += xMathMLFuncWithCoeff(
                getSignML(poly.coeffs[poly.order()], { alwaysIncludeSign: false }),
                getAbsNumberML(poly.coeffs[poly.order()], prec, { removeUnit: true }),
                poly.order()        
            )
        // other terms in polynomial (except constant term)
        for (var i = poly.order() - 1; i >= 1; --i) {
            if (poly.coeffs[i] !== 0)
                str += xMathMLFuncWithCoeff(
                    getSignML(poly.coeffs[i], { alwaysIncludeSign: true }),
                    getAbsNumberML(poly.coeffs[i], prec, { removeUnit: true }),
                    i        
                )
        }
        // constant term
        if (poly.coeffs[0] !== 0)
            str += getNumberML(poly.coeffs[0], prec, {
                alwaysIncludeSign: true
            });
        return yInverseMathMLFunc(str);
    };

    /**
     *  creates a new polynomial object, the new polynomial corresponds to yfunc(y) = 0*xfunc(x)
     *  arguments: base(optional) => type of polynomial to form, if omitted a standard polynomial will be formed
     *                                with base = standardBase;
     *
     */
    p.Polynomial = function(base) {
        base = base || standardBase;

        /* for each property in standardBase add the property from the supplied base or
         * if the supplied base does not have that property add the default property from 
         * standard base */
        for (var prop in standardBase) {
            this[prop] = base[prop] || standardBase[prop];
        };

        this.error = 0;
        this.coeffs = [0];
    };

    p.Polynomial.prototype.isValid = function() {
        return (this.error === 0);
    };

    p.Polynomial.prototype.order = function() {
        return this.coeffs.length - 1;
    };

    p.Polynomial.prototype.adapt = function() {
        return this.adaptionFunc(this);
    }

    p.Polynomial.prototype.coeff_multiply = function(coeff) {
        for (var i = 0; i < this.coeffs.length; ++i)
            this.coeffs[i] *= coeff;
        return this;
    };

    p.Polynomial.prototype.toString = function(prec) {
        if (typeof prec === "undefined")
            prec = 3;
        return createStringOutput(this, this.xStrFunc, this.yInverseStrFunc, prec);
    };

    p.Polynomial.prototype.toMathML = function(prec) {
        if (typeof prec === "undefined")
            prec = 3;
        $('#log').html('<input value="' + this.toString(prec) + '"/>');
        return createMathMLOutput(this, this.xMathMLFunc, this.xMathMLFuncWithCoeff, this.yInverseMathMLFunc, prec);
    };

    p.Polynomial.prototype.eval = function(x) {
        /*
         *  f(x) = a + bx + cx^2 + dx^3
         *       = a + x(b + x(c + x(d)))
         *       = ((d*x + c)*x + b)*x + a
         */

        var sum = 0;
        var fx = this.xfunc(x)
        for (var i = this.order(); i >= 0; --i) {
            sum *= fx;
            sum += this.coeffs[i];
        }
        return this.yinverse(sum);
    };


    /**
     * Polynomial polyFromCoeffs(coeffArr, polyBase)
     *
     * returns a polynomial of order (n-1) where n is the number of coefficients provided.
     * arguments: coeffArr => array of coefficients where the index of each coefficient is the power
     *                        the coefficient corresponds to. i.e. coeffArr[2] is the coefficient to x^2
     *            polyBase(optional) => argument to call new Polynomial with
     *
     */
    p.polyFromCoeffs = function(coeffArr, polyBase) {
        var newP = new p.Polynomial(polyBase);
        for (var i = 0; i < coeffArr.length; ++i) {
            newP.coeffs[i] = coeffArr[i] || 0;
        }
        return newP;
    };


    var changeSetUp = function(maxorder, xArr, yArr) {
        var changeValues = [];
        /* 0th order values */
        changeValues[0] = [];
        for (var i = 0; i <= maxorder; ++i) {
            changeValues[0][i] = yArr[i];
        }
        for (var order = 1; order <= maxorder; ++order) {
            changeValues[order] = [];
            for (var i = 0; i <= maxorder - order; ++i) {
                changeValues[order][i] = (changeValues[order - 1][i] - changeValues[order - 1][i + 1]) / (xArr[i] - xArr[i + order]);
            }
        }
        return changeValues;
    }

    var multiplyAllWays = function(order, first, last, xArr, yArr) {
        if (order === 0) return 1;
        var sum = 0;
        while (first <= last) {
            sum += xArr[first] * multiplyAllWays(order - 1, first, last, xArr, yArr);
            ++first;
        }
        return sum;
    };
    var fastMAWimpl1 = function(order, first, last, arr) {
        /* note will fail if order === 0 */
        var sum = 0;
        if (order === 1) {
            while (first <= last) {
                sum += arr[first];
                ++first;
            }
        } else {
            while (first < last) {
                sum += arr[first] * fastMAWimpl1(order - 1, first, last, arr);
                ++first;
            }
            /* here first == last and fastMAWimpl1(order,last,last) === arr[last]^order */
            sum += Math.pow(arr[first], order)
        }
        return sum;
    };
    var fastMAW1 = function(order, first, last, arr) {
        if (order === 0) {
            return 1;
        } else {
            return fastMAWimpl1(order, first, last, arr);
        }
    };

    var MAWtable = function(maxorder, arr) {
        var values = [];
        /* 0th order values */
        /*
         * turn into array
         * var MAW = function(order,first,last,arr){
         *    var sum = 0;
         *    if(order === 0){
         *      sum = 1;
         *    }else{
         *      while(first <= last){
         *        sum += arr[first] * fastMAWimpl1(order-1,first,last,arr);
         *        ++first;
         *      }
         *    }
         *    return sum;
         *  };
         * array of form array[order][first]
         * */
        /**value of last is fixed to be maxorder - 1*/
        /*
         */

        var last = maxorder - 1;

        /* order = 0 */
        values[0] = [];
        for (var i = 0; i < maxorder; ++i) {
            values[0][i] = 1;
        }
        /* order = 1 */
        values[1] = [];
        for (var i = 0; i < maxorder; ++i) {
            var sum = 0;
            for (var j = i; j <= last; ++j) {
                sum += arr[j];
            }
            values[1][i] = sum;
        }
        for (var order = 2; order <= maxorder; ++order) {
            /* order = i */
            values[order] = [];
            for (var i = order - 1; i < maxorder; ++i) {
                var sum = 0;
                for (var j = i; j < last; ++j) {
                    sum += arr[j] * values[order - 1][j];
                }
                /* j = last */
                sum += Math.pow(arr[last], order);
                values[order][i] = sum;
            }
        }
        return values;
    }

    var duplicate = function(arr, func) {
        func = func || function(x) {
            return x;
        }
        var l = arr.length;
        var rtn = [];
        for (var i = 0; i < l; ++i)
            rtn[i] = func(arr[i]);
        return rtn;
    }

    /**
     * Polynomial polyFromCoors(xArr,yArr,polyBase,pointsToUse)
     *
     * returns a polynomial of order (n-1) where n is the number of coordinates provided
     * arguments: xArr, yArr => array of x coordinates and y coordinates respectively,
     *                          both arrays must be longer than pointsToUse or of exactly equal length if pointsToUse is not given
     *            polyBase (optional) => argument to call new Polynomial with
     *            pointsToUse => limits number of coordinates used (and hence the order of the polynomial formed)
     *            (optional)     **default is the length of the array of coordinates**
     */
    p.fastFromCoors = function(xArr, yArr, polyBase, pointsToUse) {

        var newP = new p.Polynomial(polyBase);

        xArr = duplicate(xArr, newP.xfunc);
        yArr = duplicate(yArr, newP.yfunc);


        if (typeof pointsToUse === "undefined")
            pointsToUse = xArr.length;

        var order = pointsToUse - 1;

        var changeArr = changeSetUp(order, xArr, yArr);

        newP.coeffs[order] = changeArr[order][0];

        for (var i = order - 1; i >= 0; --i) {
            var extraBit = 0;
            for (var j = i + 1; j <= order; ++j) {
                extraBit += newP.coeffs[j] * fastMAW1(j - i, 0, i, xArr);
            }
            newP.coeffs[i] = changeArr[i][0] - extraBit;
        }

        return newP.adapt();
    };
    
    
    
    p.polyFromCoors = function(xArr, yArr, polyBase, pointsToUse) {
        /* at high orders 25+ more accurate for points at end of array maybe reverse and average */

        var newP = new p.Polynomial(polyBase);

        /* Error checking: if two x values are identical then we have a problem */
        for (var i = 0; i < xArr.length; ++i) {
            for (var j = i + 1; j < xArr.length; ++j) {
                if (xArr[i] === xArr[j]) {
                    if (yArr[i] === yArr[j]) {
                        /* x values are identical AND y values are identical i.e. a coordinate is repeated,
                         * therefore remove that coordinate */
                        xArr.splice(i, 1);
                        yArr.splice(i, 1);
                    } else {
                        newP.error = "could not form polynomial from coordinates as there are two coordinates with the same x value";
                        /* no polynomial can be created that fits two different coordinates with same x value so flag an error*/
                        return newP;
                    }
                }
            }
        }

        xArr = duplicate(xArr, newP.xfunc);
        yArr = duplicate(yArr, newP.yfunc);

        if (typeof pointsToUse === "undefined")
            pointsToUse = xArr.length;

        var order = pointsToUse - 1;

        var changeArr = changeSetUp(order, xArr, yArr);
        var mawArr = MAWtable(order, xArr);

        newP.coeffs[order] = changeArr[order][0];

        for (var i = order - 1; i >= 0; --i) {
            var extraBit = 0;
            for (var j = i + 1; j <= order; ++j) {
                extraBit += newP.coeffs[j] * mawArr[j - i][order - 1 - i];
            }
            newP.coeffs[i] = changeArr[i][order - 1 - i] - extraBit;
        }

        return newP.adapt();
    };
    
    p.limittedOrder = function(xArr, yArr, polyBase, pointsToUse, maxOrder){
        
        var newP = new p.Polynomial(polyBase);
        
        if(pointsToUse != null)
        {
            xArr = xArr.slice(0,pointsToUse);
            yArr = yArr.slice(0,pointsToUse);
        }
                    
        var X = $M(
                    duplicate(xArr, newP.xfunc).map(function(x){
                        var arr = [];
                        var raisedX = 1;
                        
                        for(var i = 0; i < maxOrder+1; ++i){
                            arr.push(raisedX);
                            raisedX *= x;
                        }
                        return arr;
                    })
                );
                
        var y = $V(yArr);
        
        // y = Xa + e (where X is m*n matrix and X_ij = (x_i)^j and e contains the random error)
        
        // a = ( (X^T)X )^(-1) (X^T) y
        
        var XT = X.transpose();
        
        var a = XT.x(X).inverse().x(XT).x(y);
        
        // sylvester indexes from 1
        a.each(function(val,i){
            newP.coeffs[i-1] = val;
        });
        
        return newP.adapt();
    }
    
    
    /**
     * Creates a polynomial from the coordinates and extra information provided
     *
     * **Note:** If 'length' attribute is not provided then x and y arrays must be exactly
     * the same length otherwise an exception will be thrown.
     *
     * Arguments:
     *  - {array} x Array of x coordinates stored as a number
     *  - {array} y Array of y coordinates stored as a number
     *  - {integer} [x.length] length Number of coordinates to use to create polynomial, 
     *  must be less than x.length and y.length
     *  - {object} [standardBase] base Object with functions to create custom polynomials
     *  - {integer} [Infinity] maxOrder Max order of polynomial to form, if the number of points is
     *  greater than the order+1 then curve is fitted using linear regression
     *
     * @param {object} args Arguments to create polynomial from
     *
     * @returns {Polynomial} Returns new polynomial
     *
     * @example
     *  TODO insert example
    */
    p.createPoly = function(args){
        
        args = args || {};
        
        if(args.x === undefined || args.y === undefined){
            throw new Error("Array of x and y coordinates must be provided");
        }
        
        var length = args.length;
        
        if(length === undefined){
            length = args.x.length;
            if(length !== args.y.length){
                throw new Error("If custom length is not provided both x and " + 
                    "y coordinate arrays must have the same length");
            }
        }else{
            if(length > args.x.length || length > args.y.length){
                throw new Error("Custom length is longer than length of coordinate arrays");
            }
        }
        
        var maxOrder = args.maxOrder;
        
        if(!isFinite(maxOrder) || maxOrder + 1 > length)
        {
            return p.polyFromCoors(args.x, args.y, args.base, length);
        }
        else
        {
            return p.limittedOrder(args.x, args.y, args.base, length, maxOrder);
        }
    
    }

    return p;
};

module.exports = createPolyLib();