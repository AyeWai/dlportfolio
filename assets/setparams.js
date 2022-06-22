/*
 * Welcome to your app's main JavaScript file!
 *
 * We recommend including the built version of this JavaScript file
 * (and its CSS file) in your base layout (base.html.twig).
 */

// any CSS you import will output into a single css file (app.css in this case)
import './styles/setparams.css';

// start the Stimulus application
import './bootstrap';

// Zoom functionality is a little buggy.
// Sorry about that. :P

/*=================================
=            Constants            =
=================================*/

var RULES = {
    '128'              : '128/128',
    '256'         : '256/128',
    '512'            : '512/128',
};

// Value on right is iterations per second
//
var SPEEDS = {
    'Fastest' : 1000,
    'Faster'  : 100,
    'Fast'    : 50,
    'Normal'  : 20,
    'Slow'    : 10,
    'Slower'  : 5,
    'Slowest' : 1
};

var MIN_ZOOM = 1;

var MAX_ZOOM = 4;

/*=====  End of Constants  ======*/



/*============================
=            Rule            =
============================*/

var Rule = function(rulestring) {
    this.rulestring = rulestring;
    var arr = rulestring.split('/');
    this.survive = arr[0];
    this.birth = arr[1];
};

Rule.prototype = {

    getNextState: function(state, adjActive) {
        if (state) {
            return this.survive.indexOf('' + adjActive) > -1;
        } else {
            return this.birth.indexOf('' + adjActive) > -1;
        }
    }

};

/*=====  End of Rule  ======*/



/*============================
=            Grid            =
============================*/

var Grid = function(width, height, ruleName) {
    this.width = width;
    this.height = height;
    this.rule = new Rule(RULES[ruleName]);
    this.current = [];
    this.next = [];
    this.reset();
};

Grid.prototype = {

    generateNextGrid: function() {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                this.setNextState(x, y);
            }
        }
    },

    setNextState: function(x, y) {
        var adjActive = 0,
            n = y - 1 < 0 ? this.height - 1 : y - 1,
            e = x + 1 >= this.width ? 0 : x + 1,
            s = y + 1 >= this.height ? 0 : y + 1,
            w = x - 1 < 0 ? this.width - 1 : x - 1;

        if (this.current[w][n]) adjActive++; // nw
        if (this.current[x][n]) adjActive++; // n
        if (this.current[e][n]) adjActive++; // ne
        if (this.current[w][y]) adjActive++; // w
        if (this.current[e][y]) adjActive++; // e
        if (this.current[w][s]) adjActive++; // sw
        if (this.current[x][s]) adjActive++; // s
        if (this.current[e][s]) adjActive++; // se

        this.next[x][y] = this.rule.getNextState(
            this.current[x][y], adjActive
        );
    },

    pushBackGrid: function() {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                this.current[x][y] = this.next[x][y];
            }
        }
    },

    reset: function() {
        for (var x = 0; x < this.width; x++) {
            this.current[x] = [];
            this.next[x] = [];

            for (var y = 0; y < this.height; y++) {
                this.current[x][y] = false;
                this.next[x][y] = false;
            }
        }
    }
};

/*=====  End of Grid  ======*/



/*===================================
=            Environment            =
===================================*/

var Environment = function(grid, speed, zoom) {
    this.grid  = grid;
    this.speed = SPEEDS[speed] || SPEEDS['Normal'];
    this.zoom  = zoom < MIN_ZOOM ? MIN_ZOOM :
        (zoom > MAX_ZOOM ? MAX_ZOOM : zoom) || MIN_ZOOM;

    this.canvas        = document.getElementById('canvas');
    this.playButton    = document.getElementById('play');
    this.nextButton    = document.getElementById('next');
    this.rulesSelect   = document.getElementById('rules');
    this.speedSelect   = document.getElementById('speed');
    this.widthInput    = document.getElementById('grid-width');
    this.heightInput   = document.getElementById('grid-height');
    this.zoomInButton  = document.getElementById('zoom-in');
    this.zoomOutButton = document.getElementById('zoom-out');
    this.seedButton    = document.getElementById('seed');
    this.resetButton   = document.getElementById('reset');
    this.context       = this.canvas.getContext('2d');
    this.playing       = false;

    this.updateCanvasDimensions();
    this.updateZoomButtons();
    this.populateRulesSelect();
    this.populateSpeedSelect();
    this.populateDimensionInputs();
    this.bindCanvasEvents();
    this.bindControlPanelEvents();
};

Environment.prototype = {

    updateCanvasDimensions: function() {
        this.canvas.width = this.grid.width;
        this.canvas.height = this.grid.height;
        this.canvas.style.width = (this.grid.width * this.zoom) + 'px';
        this.canvas.style.height = (this.grid.height * this.zoom) + 'px';
    },

    populateRulesSelect: function() {
        for (var key in RULES) {
            var option = document.createElement('option'),
                text = document.createTextNode(key);

            option.appendChild(text);
            option.value = RULES[key];

            if (RULES[key] === this.grid.rule.rulestring) {
                option.selected = true;
            }

            this.rulesSelect.appendChild(option);
        }
    },

    populateSpeedSelect: function() {
        for (var key in SPEEDS) {
            var option = document.createElement('option'),
                text = document.createTextNode(key);

            option.appendChild(text);
            option.value = SPEEDS[key];

            if (SPEEDS[key] === this.speed) {
                option.selected = true;
            }

            this.speedSelect.appendChild(option);
        }
    },

    populateDimensionInputs: function() {
        this.widthInput.value = this.grid.width;
        this.heightInput.value = this.grid.height;
    },

    updateZoomButtons: function() {
        if (this.zoom === MIN_ZOOM) {
            this.zoomOutButton.disabled = true;
        } else {
            this.zoomOutButton.disabled = false;
        }

        if (this.zoom === MAX_ZOOM) {
            this.zoomInButton.disabled = true;
        } else {
            this.zoomInButton.disabled = false;
        }
    },

    bindCanvasEvents: function() {
        var self = this,
            mousedown = false,
            activateCell = true,
            lastX = -1,
            lastY = -1;

        this.canvas.addEventListener('mousedown', function(e) {
            var x = self.getX(e),
                y = self.getY(e);

            activateCell = !self.grid.current[x][y];
            self.grid.current[x][y] = activateCell;
            self.mousedown = true;
        }, false);

        this.canvas.addEventListener('mouseup', function(e) {
            self.mousedown = false;
            lastX = -1;
            lastY = -1;
        }, false);

        this.canvas.addEventListener('mousemove', function(e) {
            var x = self.getX(e),
                y = self.getY(e);

            if (self.mousedown && (x !== lastX || y !== lastY)) {
                self.setCell(x, y, activateCell);
            }
        }, false);
    },

    bindControlPanelEvents: function() {
        var self = this;

        this.playButton.addEventListener('click', function() {
            self.playing = !self.playing;

            if (self.playing) {
                self.playButton.innerHTML = 'Pause';
                self.nextButton.disabled = true;
                self.play(self);
            } else {
                self.playButton.innerHTML = 'Play';
                self.nextButton.disabled = false;
            }
        }, false);

        this.nextButton.addEventListener('click', function() {
            self.generateNextGrid();
        }, false);

        this.rulesSelect.addEventListener('change', function() {
            self.grid.rule = new Rule(self.rulesSelect.value);
        }, false);

        this.speedSelect.addEventListener('change', function() {
            self.speed = parseInt(self.speedSelect.value);
        }, false);

        this.widthInput.addEventListener('change', function() {
            try {
                var width = parseInt(self.widthInput.value);

                if (self.widthInput.value === '' || width < 1) {
                    width = 1;
                    self.widthInput.value = 1;
                }

                self.grid.width = width;
            } catch (err) {
                self.widthInput.value = 1;
                self.grid.width = 1;
            }

            self.resetButton.click();
            self.updateCanvasDimensions();
        }, false);

        this.heightInput.addEventListener('change', function() {
            try {
                var height = parseInt(self.heightInput.value);

                if (self.heightInput.value === '' || height < 1) {
                    height = 1;
                    self.heightInput.value = 1;
                }

                self.grid.height = height;
            } catch (err) {
                self.heightInput.value = 1;
                self.grid.height = 1;
            }

            self.resetButton.click();
            self.updateCanvasDimensions();
        }, false);

        this.zoomInButton.addEventListener('click', function() {
            self.zoomIn();
        }, false);

        this.zoomOutButton.addEventListener('click', function() {
            self.zoomOut();
        }, false);

        this.seedButton.addEventListener('click', function() {
            for (var x = 0; x < self.grid.width; x++) {
                for (var y = 0; y < self.grid.height; y++) {
                    if (Math.floor((Math.random() * 20) + 1) === 1) {
                        self.setCell(x, y, true);
                    }
                }
            }
        }, false);

        this.resetButton.addEventListener('click', function() {
            if (self.playing) {
                self.playButton.click();
            }

            self.reset();
        }, false);
    },

    getX: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        return Math.floor((e.pageX - rect.left) / this.zoom);
    },

    getY: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        return Math.floor((e.pageY - rect.top) / this.zoom);
    },

    zoomIn: function() {
        this.zoom++;
        this.updateCanvasDimensions();
        this.updateZoomButtons();
    },

    zoomOut: function() {
        this.zoom--;
        this.updateCanvasDimensions();
        this.updateZoomButtons();
    },

    setCell: function(x, y, state) {
        this.putPixelInState(x, y, state);
        this.grid.current[x][y] = state;
    },

    putPixelInState: function(x, y, state) {
        if (state) {
            this.putPixel(x, y, '#00bcd4');
        } else {
            this.putPixel(x, y, '#000');
        }
    },

    putPixel: function(x, y, color) {
        this.context.fillStyle = color;
        this.context.fillRect(x, y, 1, 1);
    },

    generateNextGrid: function() {
        for (var x = 0; x < this.grid.width; x++) {
            for (var y = 0; y < this.grid.height; y++) {
                this.grid.setNextState(x, y);

                if (this.grid.current[x][y] !== this.grid.next[x][y]) {
                    this.putPixelInState(x, y, this.grid.next[x][y]);
                }
            }
        }

        this.grid.pushBackGrid();
    },

    play: function(self) {
        function animate() {
            self.generateNextGrid();

            if (self.playing) {
                setTimeout(animate, Math.round(1000 / self.speed));
            }
        }

        animate();
    },

    reset: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.grid.reset();
    }
};

/*=====  End of Environment  ======*/



var env = new Environment(new Grid(300, 147, 'Conway'), 'Fastest', 4);
env.seedButton.click();
env.playButton.click();
