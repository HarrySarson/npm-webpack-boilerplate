module.exports = function($,polyLib,lsm,bases) {
    
    var new_poly = polyLib;
    var storage = lsm;
    storage.lastModeKey = "lastMode";

    storage.setLastMode = function(mode) {
        this.storage.setItem(this.lastModeKey, mode);
    };
    storage.getLastMode = function() {
        return this.storage.getItem(this.lastModeKey) || 0;
    };

    /* make the mathjax processing messages look nicer */
    /*
    $("#MathJax_Message").appendTo($(".bot"))
    
    MathJax.Hub.Config({
        styles: {
            "#MathJax_Message": {
                "position": "static",
                "background-color": "transparent",
                'border-style': "none"
            }
        }
    });
    */
    MathJax.Message.Set("hhelo",null,5000);
    console.log(MathJax.Message.Log());
    
    $(".viewer").click(function(e){
        if (!$(e.target).hasClass("no-click")) { }
            //alert(e); 
    });

    function ColorId(_r, _g, _b, _a) {
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


    function PixelEditor(cnv) {
        this.canvas = cnv;
        this.ctx = this.canvas.getContext("2d");

        this.clear = function() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.width);
        };

    }

    var SmartInterval = function() {
        this.id = 0;
    }

    SmartInterval.prototype.set = function(f, i) {
        // clear existing interval
        if (this.id)
            clearInterval(this.id);
        this.id = setInterval(f, i);
    };
    SmartInterval.prototype.clear = function() {
        if (this.id !== 0) {
            clearInterval(this.id);
            this.id = 0;
            return true;
        }
        return false;
    };

    // tests whether or not an interval has been set
    SmartInterval.prototype.test = function() {
        return !!this.id;
    };

    var getCoor = function(e, pix, z) {
        var x = 0,
            y = 0;
        if (e.pageX) {
            return {
                x: (e.pageX - pix.canvas.width / 2) * z,
                y: (pix.canvas.height - e.pageY) * z
            }
        } else {
            return 0;
        }
    }

    function withSign(n) {
        return (n > 0) ? "+" + n.toString() : n.toString();
    }

    function optPrec(n, p) {
        if (typeof p === 'undefined') return n;
        else return n.toPrecision(p)
    };

    var formPoly = function(arr, mode, len) {
        return new_poly.polyFromCoors(arr.x, arr.y, bases[mode], len);
    };

    var points = {
        x: [],
        y: []
    };
    var polypol = [];
    var plotFrom = 0;
    var zoomIndex = 1;
    var pix = new PixelEditor($("#plottedCanvas")[0]);
    var modeId = 0;
    var stepConst = 0.1;
    var showingPicture = false;
    var showingFormula = false;
    var showingMenu = false;
    var scrollZoom;

    var new_vars = {
        currentMode: 0
    }

    window.addEventListener('resize', resizeCanvas, false);
    checkMode();


    // make function box right length
    $("#polyParent").css({
        // borders of menu = 20px, borders of polyParent = 46px
        'width': window.innerWidth - 10 - ($("#polyParent").outerWidth(true) - $("#polyParent").width()) - $(".right-side").outerWidth()
    });

    $("#topMenu").width(window.innerWidth - $(".right-side").outerWidth(false) - 10);

    // set up warning box (this is script as same box is used for script not enabled errors)
    $("#warning").html("Error: line cannot have infinite gradient!<br/>\
                        The point has been removed<br/>\
                        Click to clear this message");

    $("#warning").click(function() {
        $(this).css({
            'display': 'none'
        });
    }).click();

    var resizeCanvas = (function() {
        var doResizeSoon = true;

        setInterval(function() {
            if (doResizeSoon) {
                doResizeSoon = false;
                pix.canvas.width = window.innerWidth;
                pix.canvas.height = window.innerHeight;

                // Plot with greater precision
                for (var i = plotFrom; i < polypol.length; ++i) {
                    plot(pix, polypol[i], 1, rainbow[i % rainbow.length]);
                }
                put_point_arr(pix, points, colorPicker.black);
            }
        }, 1000 / 60);
        return function() {
            doResizeSoon = true;
        }
    })();

    (function() {
        var clickY = 0;
        var above = $("#aboveSlider");
        var below = $("#belowSlider");
        var sld = $("#slider");

        var oldAbove = 0;
        var oldBelow = 0;

        var zPos = 0;
        var zoomMiddle = 0.5 * ($("#zoom").height() - sld.height());

        var setCSS = function(a, b) {
            requestAnimationFrame(function() {
                above.css({
                    height: a
                });
                below.css({
                    height: b
                });
            });
        }

        setCSS(zoomMiddle, zoomMiddle);

        function updateIndex() {
            /* Key values
             *    zPos    weighted    zoomIndex
             *    +inf             2.99573    20
             *     1                 2.30259    10
             *     0                  0.00000    1
             *    -1                -2.30259    1/10
             *    -inf            -2.99573    1/20
             */
            var weighted;

            weighted = 5.991464547107981986870447152285081551353203245 / Math.PI * Math.atan(zPos * 2.629195052004210450505750294928461411068494253);

            zoomIndex = Math.exp(-weighted);
            sld.html((1 / zoomIndex * 100).toFixed() + "%");
            resizeCanvas();
        }

        function doclick(y) {
            clickY = y;
            oldAbove = above.height();
            oldBelow = below.height();
        }

        function moveSlider(y) {
            var distFromClick = y - clickY;
            if (!clickY || !distFromClick) return;
            if (distFromClick <= -oldAbove) {
                setCSS(0, 2 * zoomMiddle);
                zPos = (zoomMiddle - oldAbove - distFromClick) / zoomMiddle;
            } else if (distFromClick >= oldBelow) {
                setCSS(2 * zoomMiddle, 0);
                zPos = (zoomMiddle - oldAbove - distFromClick) / zoomMiddle;
            } else {
                setCSS(oldAbove + distFromClick, oldBelow - distFromClick);
                zPos = (zoomMiddle - oldAbove - distFromClick) / zoomMiddle;
            }
            updateIndex();
        }
        $('.vpad').mouseout(function() {
            sld.css({
                color: "white"
            });
        });
        $('body').mouseleave(function() {
            clickY = 0;
        }).mouseup(function() {
            clickY = 0;
        });
        sld.mousedown(function(e) {
            doclick(e.pageY);
        });
        $(".right-side").mousemove(function(e) {
            moveSlider(e.pageY);
        });

        (function() {
            var moveInt = new SmartInterval();

            var atEndOfRange = function(x) {
                zPos += x;
                updateIndex();
            }

            var padMouseDown = function(moveInterval, abv, blw, step) {
                // undo effect of bottom-pad
                if (Math.abs(zPos) > 1 && step * zPos < 0) {
                    zPos /= Math.abs(zPos);
                    updateIndex();
                }
                moveInterval.set(function() {
                    if (Math.abs(zPos) <= 1 || step * zPos < 0) {
                        setCSS(abv.height() - step, blw.height() + step);
                    }
                    atEndOfRange(step / zoomMiddle);
                }, 10);
            }

            $(".top-pad").mousedown(function() {
                padMouseDown(moveInt, above, below, 2);
            })
            $(".bottom-pad").mousedown(function() {
                padMouseDown(moveInt, above, below, -2);
            })
            $(".vpad").mouseup(function() {
                moveInt.clear();
            });

            scrollZoom = function(step) {
                var goingTowardsMiddle = step * zPos < 0;
                if (Math.abs(zPos) > 1 && goingTowardsMiddle) {
                    zPos /= Math.abs(zPos);
                    updateIndex();
                }
                if (Math.abs(zPos) <= 1 || goingTowardsMiddle) {
                    setCSS(above.height() - step, below.height() + step);
                }
                atEndOfRange(step / zoomMiddle);
            }

            $(window).bind('mousewheel', function(event) {
                scrollZoom((event.originalEvent.wheelDelta >= 0) * 20 - 10);
            });
        })();

        function undo_zoom() {
            requestAnimationFrame(function() {
                above.css({
                    height: zoomMiddle
                });
                below.css({
                    height: zoomMiddle
                });
            });
            zPos = 0;
            updateIndex();
        }

        $("#resetBox").click(function() {
            new_poly.createMathML("", "po");
            points = {
                x: [],
                y: []
            };
            lastColor = 0;
            plotFrom = 0;
            polypol = [];
            pix.clear();
            undo_zoom();
        });
        $("#unzoomer").click(undo_zoom);
    })();


    $('#pictureButton').click(function() {
        showingPicture = true;
        // show picture
        requestAnimationFrame(function() {
            $('#imageHolder').css({
                'display': 'block'
            });
            $('#imageItSelf').attr('src', pix.canvas.toDataURL());
            // hide menu
            $(".fullMenu").css({
                'display': 'none'
            });
            $(".hiddenMenu").css({
                'display': 'none'
            });
        });
    });

    $('#backButton').click(function() {
        showingPicture = false;
        requestAnimationFrame(function() {
            // hide picture
            $('#imageHolder').css({
                'display': ''
            });
            if (showingMenu) {
                // show full menu
                $(".fullMenu").css({
                    'display': 'block'
                });
            } else {
                // show hidden menu
                $("#hiddenMenu").css({
                    'display': 'block'
                });
            }
        });
    });

    var hideMenu = function() {
        $(".fullMenu").css({
            'display': 'none'
        });
        $("#hiddenMenu").css({
            'display': 'block'
        });
        showingMenu = true;
    };
    var showMenu = function() {
        $(".fullMenu").css({
            'display': 'block'
        });
        $("#hiddenMenu").css({
            'display': 'none'
        });
        showingMenu = true;
    }
    $("#hider").click(hideMenu);
    $("#shower").click(showMenu);
    $(document).keydown(function(e) {
        // at beginning when no mode has been chosen, disable hotkeys 
        if (new_vars.currentMode == 0)
            return;
        // '\n' brings up/closes menu
        if (e.which === 13) {
            if (showingMenu)
                hideMenu();
            else
                showMenu();
        }
        // ' ' (space) fades in/out the mode selection
        else if (e.which === 32) {
            toggleMenu();
        }
        // 'p' creates a picture
        else if (e.which === 80 && !showingPicture) {
            $('#pictureButton').click();
        }
        // 'p' or escape hides picture
        else if ((e.which == 80 || e.which == 27) && showingPicture) {
            $('#backButton').click();
        }
        // escape hides formula
        else if (e.which == 27 && showingFormula) {
            $('#polyCopy').blur();
        }
        // '-' zooms out
        else if (e.which == 189 || e.which == 109) {
            scrollZoom(-10);
        }
        // '+' zooms in
        else if (e.which == 187 || e.which == 107) {
            scrollZoom(10);
        }
    });

    $("#plottedCanvas").mousemove(function(e) {
        var c = getCoor(e, pix, zoomIndex);
        if (c) {
            $("#posOpX").text(c.x.toPrecision(3));
            $("#posOpY").text(c.y.toPrecision(3));
            //MathJax.Hub.Queue(["Typeset",MathJax.Hub,"posOp"]);
        }
    });

    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toGMTString();
        document.cookie = cname + "=" + cvalue + ", " + expires;
    }

    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i].trim();
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    }

    function toggleMenu(on) {
        if (typeof on === 'undefined') {
            on = !(toggleMenu.running);
        }
        if (on && !arguments.callee.running) {
            $('#overlay').fadeIn(300);
            $('#modeOptions').fadeIn(300);
            arguments.callee.running = true;
        } else if (arguments.callee.running && !on) {
            $('#overlay').fadeOut(300);
            arguments.callee.running = false;
        }
    }

    function checkMode() {
        var mode = storage.getLastMode();
        if (typeof bases[mode] === "undefined") {
            mode = 0;
            console.log("Stored mode \"" + mode + "\" cannot be identified, will ask user which mode to use");
        }
        if (mode === 0 || !setMode(mode)) {
            toggleMenu(true);
        }
    }


    function setMode(modeName) {
        if (typeof bases[modeName] === "undefined") {
            throw "Error: base not found";
        }
        var updateExisting = polypol.length;
        storage.setLastMode(modeName);
        if (new_vars.currentMode != modeName || updateExisting) {
            new_vars.currentMode = modeName;

            document.title = modeName + " Polynomial Plotter";

            if (updateExisting) {
                pix.clear();

                // Plot points                    
                put_point_arr(pix, points, colorPicker.black);

                // reset array of graphs
                polypol = new Array();

                // fill array of graphs
                for (var i = 2; i <= points.x.length; ++i) {
                    polypol.push(formPoly(points, modeName, i));
                }

                // Plot graphs
                for (var i = plotFrom; i < polypol.length; ++i) {
                    plot(pix, polypol[i], 1, rainbow[i % rainbow.length]);
                }

                // do text output        
                new_poly.createMathML(lastElement(polypol).toMathML(), "po");
            }
        }
        return true;
    }

    $("#modeSelect").click(function() {
        toggleMenu(true);
    });
    $('#clearOld').click(function() {
        if (polypol.length > 0) {
            pix.clear();
            plotFrom = polypol.length - 1;
            put_point_arr(pix, points, colorPicker.black);
            plot(pix, lastElement(polypol), 1, rainbow[(polypol.length - 1) % rainbow.length]);
        }
    });
    $('#restorePoints').click(function() {
        pix.clear();
        plotFrom = 0;

        for (var i = plotFrom; i < polypol.length; ++i) {
            plot(pix, polypol[i], 1, rainbow[i % rainbow.length]);
        }

        put_point_arr(pix, points, colorPicker.black);
    });
    $('#polyParent').click(function() {
        if (showingFormula || polypol.length === 0) return;
        showingFormula = true;
        $("#polyCopy").css({
            'display': 'inline-block'
        }).val(lastElement(polypol).toString(6)).select();
        $("#polyNormal").css({
            'display': 'none'
        });
    }).mouseleave(function() {
        showingFormula = false;
        $("#polyNormal").css({
            'display': 'inline'
        });
        $("#polyCopy").css({
            'display': 'none'
        });
    });

    $("#plottedCanvas").click(function(e) {
        // remove warning message if it is there
        $("#warning").css({
            'display': 'none'
        });
        var c = getCoor(e, pix, zoomIndex);
        if (!c || c === 0)
        /* coordinate is invalid so ignore */
            return;
        var iOfx = points.x.indexOf(c.x);
        if (iOfx !== -1) {
            /* have two coordinates with same x-value */
            if (points.y[iOfx] === c.y) {
                /* coordinate to be added is identical to a coordinate already in the array
                 * so ignore coordinate (do not add it to array) */
                return;
            } else {
                /* two coordinates with same x but different y, impossible to be matched to a function of x */
                $("#warning").show();
                return;
            }
        }
        points.x.push(c.x);
        points.y.push(c.y);
        if (points.x.length > 1) {
            var p = formPoly(points, new_vars.currentMode);
            if (p.isValid()) {
                plot(pix, p, 1, rainbow[polypol.length % rainbow.length]);
                polypol.push(p);
                new_poly.createMathML(lastElement(polypol).toMathML(), "po");
            } else {
                /* error creating polynomial */
                points.x.pop();
                points.y.pop();
                $("#warning").show();
                return;
            }
        }
        put_point(pix, lastElement(points.x), lastElement(points.y), colorPicker.black);
    });

    function plot(pxl, poly, step, colorInfo) {
        // Set min and max for plotting
        var pxl = pix,
            a = -(pix.canvas.width - 1) / 2,
            b = (pix.canvas.width - 1) / 2;

        // Convert 'a' value to x/y plottable coordinates

        var getX = function() {
            return Math.ceil(pxl.canvas.width / 2 + a);
        };
        var getY = function() {
            return Math.ceil(pxl.canvas.height - poly.eval(a * zoomIndex) / zoomIndex);
        };

        // Set first two coordinates
        var xC = getX();
        var yC = getY();


        requestAnimationFrame(function() {
            pxl.ctx.save();

            // Curve is made from many chords,
            pxl.ctx.beginPath();
            // Beginning of the chord
            pxl.ctx.moveTo(xC, yC);

            a += step;
            while (a < b) {
                a += step;
                xC = getX();
                yC = getY();
                // End of the chord
                pxl.ctx.lineTo(xC, yC);
            }

            // Set colour of lines
            pxl.ctx.lineJoin = 'round';
            pxl.ctx.lineWidth = 3;
            pxl.ctx.strokeStyle = colorInfo + "";
            // Put to canvas
            pxl.ctx.stroke();
            pxl.ctx.restore();
        });

    };

    function put_point(pxl, x, y, col) {
        var diameter = 19 / Math.pow(zoomIndex, 0.25);
        console.log(diameter);
        var xCenter = Math.round(x / zoomIndex);
        var yCenter = Math.round(y / zoomIndex);
        if (xCenter > -pxl.canvas.width / 2 &&
            xCenter < pxl.canvas.width / 2 &&
            yCenter > -pxl.canvas.width / 2) {
            var fmtX = function(x) {
                return pix.canvas.width / 2 + x;
            }
            var fmtY = function(y) {
                return pix.canvas.height - y;
            }

            var radius = Math.round(diameter / 2);
            var diag = Math.round(radius / Math.SQRT2);
            // plot +ve diagonal line

            requestAnimationFrame(function() {
                pxl.ctx.save();

                pxl.ctx.beginPath();
                pxl.ctx.moveTo(fmtX(xCenter - diag), fmtY(yCenter - diag));
                pxl.ctx.lineTo(fmtX(xCenter + diag), fmtY(yCenter + diag));

                // plot -ve diagonal line
                pxl.ctx.moveTo(fmtX(xCenter + diag), fmtY(yCenter - diag));
                pxl.ctx.lineTo(fmtX(xCenter - diag), fmtY(yCenter + diag));

                pxl.ctx.strokeStyle = '#000';
                pxl.ctx.lineWidth = Math.ceil(diameter / 15);
                pxl.ctx.stroke();
                pxl.ctx.restore();
            });
        }
    };

    function put_point_arr(pxl, arr, col) {
        for (var i = 0; i < arr.x.length; ++i) {
            put_point(pxl, arr.x[i], arr.y[i], col);
        }
    };
}