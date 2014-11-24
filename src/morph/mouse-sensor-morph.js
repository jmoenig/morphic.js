// MouseSensorMorph ////////////////////////////////////////////////////

// for demo and debuggin purposes only, to be removed later

var MouseSensorMorph;

// MouseSensorMorph inherits from BoxMorph:

MouseSensorMorph.prototype = new BoxMorph();
MouseSensorMorph.prototype.constructor = MouseSensorMorph;
MouseSensorMorph.uber = BoxMorph.prototype;

// MouseSensorMorph instance creation:

function MouseSensorMorph(edge, border, borderColor) {
    this.init(edge, border, borderColor);
}

MouseSensorMorph.prototype.init = function (edge, border, borderColor) {
    MouseSensorMorph.uber.init.call(this);
    this.edge = edge || 4;
    this.border = border || 2;
    this.color = new Color(255, 255, 255);
    this.borderColor = borderColor || new Color();
    this.isTouched = false;
    this.upStep = 0.05;
    this.downStep = 0.02;
    this.noticesTransparentClick = false;
    this.drawNew();
};

MouseSensorMorph.prototype.touch = function () {
    var myself = this;
    if (!this.isTouched) {
        this.isTouched = true;
        this.alpha = 0.6;

        this.step = function () {
            if (myself.isTouched) {
                if (myself.alpha < 1) {
                    myself.alpha = myself.alpha + myself.upStep;
                }
            } else if (myself.alpha > (myself.downStep)) {
                myself.alpha = myself.alpha - myself.downStep;
            } else {
                myself.alpha = 0;
                myself.step = null;
            }
            myself.changed();
        };
    }
};

MouseSensorMorph.prototype.unTouch = function () {
    this.isTouched = false;
};

MouseSensorMorph.prototype.mouseEnter = function () {
    this.touch();
};

MouseSensorMorph.prototype.mouseLeave = function () {
    this.unTouch();
};

MouseSensorMorph.prototype.mouseDownLeft = function () {
    this.touch();
};

MouseSensorMorph.prototype.mouseClickLeft = function () {
    this.unTouch();
};
