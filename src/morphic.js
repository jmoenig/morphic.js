/* requires:
001_settings.js
002_functions.js
003_retina.js
005_animations.js
006_colors.js
007_points.js
008_rectangle.js
009_node.js
010_morph.js
011_pen.js
012_colorpalette.js
013_graypalette.js
014_colorpicker.js
015_blinker.js
016_cursor.js
017_box.js
018_speechbubble.js
*/

// DialMorph //////////////////////////////////////////////////////

// I am a knob than can be turned to select a number

var DialMorph;

// DialMorph inherits from Morph:

DialMorph.prototype = new Morph();
DialMorph.prototype.constructor = DialMorph;
DialMorph.uber = Morph.prototype;

function DialMorph(min, max, value, tick, radius) {
    this.init(min, max, value, tick, radius);
}

DialMorph.prototype.init = function (min, max, value, tick, radius) {
    this.target = null;
    this.action = null;
    this.min = min || 0;
    this.max = max || 360;
    this.value = Math.max(this.min, (value || 0) % this.max);
    this.tick = tick || 15;
    this.fillColor = null;

    DialMorph.uber.init.call(this);

    this.color = new Color(230, 230, 230);
    this.noticesTransparentClick = true;
    this.setRadius(radius || MorphicPreferences.menuFontSize * 4);
};

DialMorph.prototype.setRadius = function (radius) {
    this.radius = radius;
    this.setExtent(new Point(this.radius * 2, this.radius * 2));
};

DialMorph.prototype.setValue = function (value, snapToTick, noUpdate) {
    var range = this.max - this.min;
    value = value || 0;
    this.value = this.min + (((+value % range) + range) % range);
    if (snapToTick) {
        if (this.value < this.tick) {
            this.value = this.min;
        } else {
            this.value -= this.value % this.tick % this.value;
        }
    }
    this.drawNew();
    this.changed();
    if (noUpdate) {return; }
    this.updateTarget();
};

DialMorph.prototype.getValueOf = function (point) {
    var range = this.max - this.min,
        center = this.center(),
        deltaX = point.x - center.x,
        deltaY = center.y - point.y,
        angle = Math.abs(deltaX) < 0.001 ? (deltaY < 0 ? 90 : 270)
            : Math.round(
                (deltaX >= 0 ? 0 : 180)
                - (Math.atan(deltaY / deltaX) * 57.2957795131)
            ),
        value = angle + 90 % 360,
        ratio = value / 360;
    return range * ratio + this.min;
};

DialMorph.prototype.setExtent = function (aPoint) {
    var size = Math.min(aPoint.x, aPoint.y);
    this.radius = size / 2;
    DialMorph.uber.setExtent.call(this, new Point(size, size));
};

DialMorph.prototype.drawNew = function () {
    var ctx, i, angle, x1, y1, x2, y2,
        light = this.color.lighter().toString(),
        range = this.max - this.min,
        ticks = range / this.tick,
        face = this.radius * 0.75,
        inner = face * 0.85,
        outer = face * 0.95;

    this.image = newCanvas(this.extent());
    ctx = this.image.getContext('2d');

    // draw a light border:
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(
        this.radius,
        this.radius,
        face + Math.min(1, this.radius - face),
        0,
        2 * Math.PI,
        false
    );
    ctx.closePath();
    ctx.fill();

    // fill circle:
    ctx.fillStyle = this.color.toString();
    ctx.beginPath();
    ctx.arc(
        this.radius,
        this.radius,
        face,
        0,
        2 * Math.PI,
        false
    );
    ctx.closePath();
    ctx.fill();

    // fill value
    angle = (this.value - this.min) * (Math.PI * 2) / range - Math.PI / 2;
    ctx.fillStyle = (this.fillColor || this.color.darker()).toString();
    ctx.beginPath();
    ctx.arc(
        this.radius,
        this.radius,
        face,
        Math.PI / -2,
        angle,
        false
    );
    ctx.lineTo(this.radius, this.radius);
    ctx.closePath();
    ctx.fill();

    // draw ticks:
    ctx.strokeStyle = new Color(35, 35, 35).toString();
    ctx.lineWidth = 1;
    for (i = 0; i < ticks; i += 1) {
        angle = (i - 3) * (Math.PI * 2) / ticks - Math.PI / 2;
        ctx.beginPath();
        x1 = this.radius + Math.cos(angle) * inner;
        y1 = this.radius + Math.sin(angle) * inner;
        x2 = this.radius + Math.cos(angle) * outer;
        y2 = this.radius + Math.sin(angle) * outer;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    // draw a filled center:
    inner = face * 0.05;
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(
        this.radius,
        this.radius,
        inner,
        0,
        2 * Math.PI,
        false
    );
    ctx.closePath();
    ctx.fill();

    // draw the inner hand:
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    angle = (this.value - this.min) * (Math.PI * 2) / range - Math.PI / 2;
    outer = face * 0.8;
    x1 = this.radius + Math.cos(angle) * inner;
    y1 = this.radius + Math.sin(angle) * inner;
    x2 = this.radius + Math.cos(angle) * outer;
    y2 = this.radius + Math.sin(angle) * outer;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // draw a read-out circle:
    inner = inner * 2;
    x2 = this.radius + Math.cos(angle) * (outer + inner);
    y2 = this.radius + Math.sin(angle) * (outer + inner);
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(
        x2,
        y2,
        inner,
        0,
        2 * Math.PI,
        false
    );
    ctx.closePath();
    ctx.stroke();

    // draw the outer hand:
    angle = (this.value - this.min) * (Math.PI * 2) / range - Math.PI / 2;
    x1 = this.radius + Math.cos(angle) * face;
    y1 = this.radius + Math.sin(angle) * face;
    x2 = this.radius + Math.cos(angle) * (this.radius - 1);
    y2 = this.radius + Math.sin(angle) * (this.radius - 1);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = light;
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // draw arrow tip:
    angle = radians(degrees(angle) - 4);
    x1 = this.radius + Math.cos(angle) * this.radius * 0.9;
    y1 = this.radius + Math.sin(angle) * this.radius * 0.9;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    angle = radians(degrees(angle) + 8);
    x1 = this.radius + Math.cos(angle) * this.radius * 0.9;
    y1 = this.radius + Math.sin(angle) * this.radius * 0.9;
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = light;
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.stroke();
    ctx.fill();
};

// DialMorph stepping:

DialMorph.prototype.step = null;

DialMorph.prototype.mouseDownLeft = function (pos) {
    var world, myself = this;
    world = this.root();
    this.step = function () {
        if (world.hand.mouseButton) {
            myself.setValue(
                myself.getValueOf(world.hand.bounds.origin),
                world.currentKey !== 16 // snap to tick
            );
        } else {
            this.step = null;
        }
    };
};

// DialMorph menu:

DialMorph.prototype.developersMenu = function () {
    var menu = DialMorph.uber.developersMenu.call(this);
    menu.addLine();
    menu.addItem(
        'set target',
        "setTarget",
        'select another morph.jsk\nwhose numerical property\nwill be ' +
        'controlled by this one'
    );
    return menu;
};

DialMorph.prototype.setTarget = function () {
    var choices = this.overlappedMorphs(),
        menu = new MenuMorph(this, 'choose target:'),
        myself = this;

    choices.push(this.world());
    choices.forEach(function (each) {
        menu.addItem(each.toString().slice(0, 50), function () {
            myself.target = each;
            myself.setTargetSetter();
        });
    });
    if (choices.length === 1) {
        this.target = choices[0];
        this.setTargetSetter();
    } else if (choices.length > 0) {
        menu.popUpAtHand(this.world());
    }
};

DialMorph.prototype.setTargetSetter = function () {
    var choices = this.target.numericalSetters(),
        menu = new MenuMorph(this, 'choose target property:'),
        myself = this;

    choices.forEach(function (each) {
        menu.addItem(each, function () {
            myself.action = each;
        });
    });
    if (choices.length === 1) {
        this.action = choices[0];
    } else if (choices.length > 0) {
        menu.popUpAtHand(this.world());
    }
};

DialMorph.prototype.updateTarget = function () {
    if (this.action) {
        if (typeof this.action === 'function') {
            this.action.call(this.target, this.value);
        } else { // assume it's a String
            this.target[this.action](this.value);
        }
    }
};

// CircleBoxMorph //////////////////////////////////////////////////////

// I can be used for sliders

var CircleBoxMorph;

// CircleBoxMorph inherits from Morph:

CircleBoxMorph.prototype = new Morph();
CircleBoxMorph.prototype.constructor = CircleBoxMorph;
CircleBoxMorph.uber = Morph.prototype;

function CircleBoxMorph(orientation) {
    this.init(orientation || 'vertical');
}

CircleBoxMorph.prototype.init = function (orientation) {
    CircleBoxMorph.uber.init.call(this);
    this.orientation = orientation;
    this.autoOrient = true;
    this.setExtent(new Point(20, 100));
};

CircleBoxMorph.prototype.autoOrientation = function () {
    if (this.height() > this.width()) {
        this.orientation = 'vertical';
    } else {
        this.orientation = 'horizontal';
    }
};

CircleBoxMorph.prototype.drawNew = function () {
    var radius, center1, center2, rect, points, x, y,
        context, ext,
        myself = this;

    if (this.autoOrient) {
        this.autoOrientation();
    }
    this.image = newCanvas(this.extent());
    context = this.image.getContext('2d');

    if (this.orientation === 'vertical') {
        radius = this.width() / 2;
        x = this.center().x;
        center1 = new Point(x, this.top() + radius);
        center2 = new Point(x, this.bottom() - radius);
        rect = this.bounds.origin.add(new Point(0, radius)).corner(
            this.bounds.corner.subtract(new Point(0, radius))
        );
    } else {
        radius = this.height() / 2;
        y = this.center().y;
        center1 = new Point(this.left() + radius, y);
        center2 = new Point(this.right() - radius, y);
        rect = this.bounds.origin.add(new Point(radius, 0)).corner(
            this.bounds.corner.subtract(new Point(radius, 0))
        );
    }
    points = [ center1.subtract(this.bounds.origin),
        center2.subtract(this.bounds.origin)];
    points.forEach(function (center) {
        context.fillStyle = myself.color.toString();
        context.beginPath();
        context.arc(
            center.x,
            center.y,
            radius,
            0,
            2 * Math.PI,
            false
        );
        context.closePath();
        context.fill();
    });
    rect = rect.translateBy(this.bounds.origin.neg());
    ext = rect.extent();
    if (ext.x > 0 && ext.y > 0) {
        context.fillRect(
            rect.origin.x,
            rect.origin.y,
            rect.width(),
            rect.height()
        );
    }
};

// CircleBoxMorph menu:

CircleBoxMorph.prototype.developersMenu = function () {
    var menu = CircleBoxMorph.uber.developersMenu.call(this);
    menu.addLine();
    if (this.orientation === 'vertical') {
        menu.addItem(
            "horizontal...",
            'toggleOrientation',
            'toggle the\norientation'
        );
    } else {
        menu.addItem(
            "vertical...",
            'toggleOrientation',
            'toggle the\norientation'
        );
    }
    return menu;
};

CircleBoxMorph.prototype.toggleOrientation = function () {
    var center = this.center();
    this.changed();
    if (this.orientation === 'vertical') {
        this.orientation = 'horizontal';
    } else {
        this.orientation = 'vertical';
    }
    this.silentSetExtent(new Point(this.height(), this.width()));
    this.setCenter(center);
    this.drawNew();
    this.changed();
};

// SliderButtonMorph ///////////////////////////////////////////////////

var SliderButtonMorph;

// SliderButtonMorph inherits from CircleBoxMorph:

SliderButtonMorph.prototype = new CircleBoxMorph();
SliderButtonMorph.prototype.constructor = SliderButtonMorph;
SliderButtonMorph.uber = CircleBoxMorph.prototype;

function SliderButtonMorph(orientation) {
    this.init(orientation);
}

SliderButtonMorph.prototype.init = function (orientation) {
    this.color = new Color(80, 80, 80);
    this.highlightColor = new Color(90, 90, 140);
    this.pressColor = new Color(80, 80, 160);
    this.is3D = false;
    this.hasMiddleDip = true;
    SliderButtonMorph.uber.init.call(this, orientation);
};

SliderButtonMorph.prototype.autoOrientation = nop;

SliderButtonMorph.prototype.drawNew = function () {
    var colorBak = this.color.copy();

    SliderButtonMorph.uber.drawNew.call(this);
    if (this.is3D || !MorphicPreferences.isFlat) {
        this.drawEdges();
    }
    this.normalImage = this.image;

    this.color = this.highlightColor.copy();
    SliderButtonMorph.uber.drawNew.call(this);
    if (this.is3D || !MorphicPreferences.isFlat) {
        this.drawEdges();
    }
    this.highlightImage = this.image;

    this.color = this.pressColor.copy();
    SliderButtonMorph.uber.drawNew.call(this);
    if (this.is3D || !MorphicPreferences.isFlat) {
        this.drawEdges();
    }
    this.pressImage = this.image;

    this.color = colorBak;
    this.image = this.normalImage;

};

SliderButtonMorph.prototype.drawEdges = function () {
    var context = this.image.getContext('2d'),
        gradient,
        radius,
        w = this.width(),
        h = this.height();

    context.lineJoin = 'round';
    context.lineCap = 'round';

    if (this.orientation === 'vertical') {
        context.lineWidth = w / 3;
        gradient = context.createLinearGradient(
            0,
            0,
            context.lineWidth,
            0
        );
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(1, this.color.toString());

        context.strokeStyle = gradient;
        context.beginPath();
        context.moveTo(context.lineWidth * 0.5, w / 2);
        context.lineTo(context.lineWidth * 0.5, h - w / 2);
        context.stroke();

        gradient = context.createLinearGradient(
            w - context.lineWidth,
            0,
            w,
            0
        );
        gradient.addColorStop(0, this.color.toString());
        gradient.addColorStop(1, 'black');

        context.strokeStyle = gradient;
        context.beginPath();
        context.moveTo(w - context.lineWidth * 0.5, w / 2);
        context.lineTo(w - context.lineWidth * 0.5, h - w / 2);
        context.stroke();

        if (this.hasMiddleDip) {
            gradient = context.createLinearGradient(
                context.lineWidth,
                0,
                w - context.lineWidth,
                0
            );

            radius = w / 4;
            gradient.addColorStop(0, 'black');
            gradient.addColorStop(0.35, this.color.toString());
            gradient.addColorStop(0.65, this.color.toString());
            gradient.addColorStop(1, 'white');

            context.fillStyle = gradient;
            context.beginPath();
            context.arc(
                w / 2,
                h / 2,
                radius,
                radians(0),
                radians(360),
                false
            );
            context.closePath();
            context.fill();
        }
    } else if (this.orientation === 'horizontal') {
        context.lineWidth = h / 3;
        gradient = context.createLinearGradient(
            0,
            0,
            0,
            context.lineWidth
        );
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(1, this.color.toString());

        context.strokeStyle = gradient;
        context.beginPath();
        context.moveTo(h / 2, context.lineWidth * 0.5);
        context.lineTo(w - h / 2, context.lineWidth * 0.5);
        context.stroke();

        gradient = context.createLinearGradient(
            0,
            h - context.lineWidth,
            0,
            h
        );
        gradient.addColorStop(0, this.color.toString());
        gradient.addColorStop(1, 'black');

        context.strokeStyle = gradient;
        context.beginPath();
        context.moveTo(h / 2, h - context.lineWidth * 0.5);
        context.lineTo(w - h / 2, h - context.lineWidth * 0.5);
        context.stroke();

        if (this.hasMiddleDip) {
            gradient = context.createLinearGradient(
                0,
                context.lineWidth,
                0,
                h - context.lineWidth
            );

            radius = h / 4;
            gradient.addColorStop(0, 'black');
            gradient.addColorStop(0.35, this.color.toString());
            gradient.addColorStop(0.65, this.color.toString());
            gradient.addColorStop(1, 'white');

            context.fillStyle = gradient;
            context.beginPath();
            context.arc(
                this.width() / 2,
                this.height() / 2,
                radius,
                radians(0),
                radians(360),
                false
            );
            context.closePath();
            context.fill();
        }
    }
};

//SliderButtonMorph events:

SliderButtonMorph.prototype.mouseEnter = function () {
    this.image = this.highlightImage;
    this.changed();
};

SliderButtonMorph.prototype.mouseLeave = function () {
    this.image = this.normalImage;
    this.changed();
};

SliderButtonMorph.prototype.mouseDownLeft = function (pos) {
    this.image = this.pressImage;
    this.changed();
    this.escalateEvent('mouseDownLeft', pos);
};

SliderButtonMorph.prototype.mouseClickLeft = function () {
    this.image = this.highlightImage;
    this.changed();
};

SliderButtonMorph.prototype.mouseMove = function () {
    // prevent my parent from getting picked up
    nop();
};

// SliderMorph ///////////////////////////////////////////////////

// SliderMorph inherits from CircleBoxMorph:

SliderMorph.prototype = new CircleBoxMorph();
SliderMorph.prototype.constructor = SliderMorph;
SliderMorph.uber = CircleBoxMorph.prototype;

function SliderMorph(start, stop, value, size, orientation, color) {
    this.init(
        start || 1,
        stop || 100,
        value || 50,
        size || 10,
        orientation || 'vertical',
        color
    );
}

SliderMorph.prototype.init = function (
    start,
    stop,
    value,
    size,
    orientation,
    color
) {
    this.target = null;
    this.action = null;
    this.start = start;
    this.stop = stop;
    this.value = value;
    this.size = size;
    this.offset = null;
    this.button = new SliderButtonMorph();
    this.button.isDraggable = false;
    this.button.color = new Color(200, 200, 200);
    this.button.highlightColor = new Color(210, 210, 255);
    this.button.pressColor = new Color(180, 180, 255);
    SliderMorph.uber.init.call(this, orientation);
    this.add(this.button);
    this.alpha = 0.3;
    this.color = color || new Color(0, 0, 0);
    this.setExtent(new Point(20, 100));
    // this.drawNew();
};

SliderMorph.prototype.autoOrientation = nop;

SliderMorph.prototype.rangeSize = function () {
    return this.stop - this.start;
};

SliderMorph.prototype.ratio = function () {
    return this.size / (this.rangeSize() + 1);
};

SliderMorph.prototype.unitSize = function () {
    if (this.orientation === 'vertical') {
        return (this.height() - this.button.height()) /
            this.rangeSize();
    }
    return (this.width() - this.button.width()) /
        this.rangeSize();
};

SliderMorph.prototype.drawNew = function () {
    var bw, bh, posX, posY;

    SliderMorph.uber.drawNew.call(this);
    this.button.orientation = this.orientation;
    if (this.orientation === 'vertical') {
        bw  = this.width() - 2;
        bh = Math.max(bw, Math.round(this.height() * this.ratio()));
        this.button.silentSetExtent(new Point(bw, bh));
        posX = 1;
        posY = Math.min(
            Math.round((this.value - this.start) * this.unitSize()),
            this.height() - this.button.height()
        );
    } else {
        bh = this.height() - 2;
        bw  = Math.max(bh, Math.round(this.width() * this.ratio()));
        this.button.silentSetExtent(new Point(bw, bh));
        posY = 1;
        posX = Math.min(
            Math.round((this.value - this.start) * this.unitSize()),
            this.width() - this.button.width()
        );
    }
    this.button.setPosition(
        new Point(posX, posY).add(this.bounds.origin)
    );
    this.button.drawNew();
    this.button.changed();
};

SliderMorph.prototype.updateValue = function () {
    var relPos;
    if (this.orientation === 'vertical') {
        relPos = this.button.top() - this.top();
    } else {
        relPos = this.button.left() - this.left();
    }
    this.value = Math.round(relPos / this.unitSize() + this.start);
    this.updateTarget();
};

SliderMorph.prototype.updateTarget = function () {
    if (this.action) {
        if (typeof this.action === 'function') {
            this.action.call(this.target, this.value);
        } else { // assume it's a String
            this.target[this.action](this.value);
        }
    }
};

// SliderMorph menu:

SliderMorph.prototype.developersMenu = function () {
    var menu = SliderMorph.uber.developersMenu.call(this);
    menu.addItem(
        "show value...",
        'showValue',
        'display a dialog box\nshowing the selected number'
    );
    menu.addItem(
        "floor...",
        function () {
            this.prompt(
                menu.title + '\nfloor:',
                this.setStart,
                this,
                this.start.toString(),
                null,
                0,
                this.stop - this.size,
                true
            );
        },
        'set the minimum value\nwhich can be selected'
    );
    menu.addItem(
        "ceiling...",
        function () {
            this.prompt(
                menu.title + '\nceiling:',
                this.setStop,
                this,
                this.stop.toString(),
                null,
                this.start + this.size,
                this.size * 100,
                true
            );
        },
        'set the maximum value\nwhich can be selected'
    );
    menu.addItem(
        "button size...",
        function () {
            this.prompt(
                menu.title + '\nbutton size:',
                this.setSize,
                this,
                this.size.toString(),
                null,
                1,
                this.stop - this.start,
                true
            );
        },
        'set the range\ncovered by\nthe slider button'
    );
    menu.addLine();
    menu.addItem(
        'set target',
        "setTarget",
        'select another morph.jsk\nwhose numerical property\nwill be ' +
        'controlled by this one'
    );
    return menu;
};

SliderMorph.prototype.showValue = function () {
    this.inform(this.value);
};

SliderMorph.prototype.userSetStart = function (num) {
    // for context menu demo purposes
    this.start = Math.max(num, this.stop);
};

SliderMorph.prototype.setStart = function (num, noUpdate) {
    // for context menu demo purposes
    var newStart;
    if (typeof num === 'number') {
        this.start = Math.min(
            num,
            this.stop - this.size
        );
    } else {
        newStart = parseFloat(num);
        if (!isNaN(newStart)) {
            this.start = Math.min(
                newStart,
                this.stop - this.size
            );
        }
    }
    this.value = Math.max(this.value, this.start);
    if (!noUpdate) {this.updateTarget(); }
    this.drawNew();
    this.changed();
};

SliderMorph.prototype.setStop = function (num, noUpdate) {
    // for context menu demo purposes
    var newStop;
    if (typeof num === 'number') {
        this.stop = Math.max(num, this.start + this.size);
    } else {
        newStop = parseFloat(num);
        if (!isNaN(newStop)) {
            this.stop = Math.max(newStop, this.start + this.size);
        }
    }
    this.value = Math.min(this.value, this.stop);
    if (!noUpdate) {this.updateTarget(); }
    this.drawNew();
    this.changed();
};

SliderMorph.prototype.setSize = function (num, noUpdate) {
    // for context menu demo purposes
    var newSize;
    if (typeof num === 'number') {
        this.size = Math.min(
            Math.max(num, 1),
            this.stop - this.start
        );
    } else {
        newSize = parseFloat(num);
        if (!isNaN(newSize)) {
            this.size = Math.min(
                Math.max(newSize, 1),
                this.stop - this.start
            );
        }
    }
    this.value = Math.min(this.value, this.stop - this.size);
    if (!noUpdate) {this.updateTarget(); }
    this.drawNew();
    this.changed();
};

SliderMorph.prototype.setTarget = function () {
    var choices = this.overlappedMorphs(),
        menu = new MenuMorph(this, 'choose target:'),
        myself = this;

    choices.push(this.world());
    choices.forEach(function (each) {
        menu.addItem(each.toString().slice(0, 50), function () {
            myself.target = each;
            myself.setTargetSetter();
        });
    });
    if (choices.length === 1) {
        this.target = choices[0];
        this.setTargetSetter();
    } else if (choices.length > 0) {
        menu.popUpAtHand(this.world());
    }
};

SliderMorph.prototype.setTargetSetter = function () {
    var choices = this.target.numericalSetters(),
        menu = new MenuMorph(this, 'choose target property:'),
        myself = this;

    choices.forEach(function (each) {
        menu.addItem(each, function () {
            myself.action = each;
        });
    });
    if (choices.length === 1) {
        this.action = choices[0];
    } else if (choices.length > 0) {
        menu.popUpAtHand(this.world());
    }
};

SliderMorph.prototype.numericalSetters = function () {
    // for context menu demo purposes
    var list = SliderMorph.uber.numericalSetters.call(this);
    list.push('setStart', 'setStop', 'setSize');
    return list;
};

// SliderMorph stepping:

SliderMorph.prototype.step = null;

SliderMorph.prototype.mouseDownLeft = function (pos) {
    var world, myself = this;

    if (!this.button.bounds.containsPoint(pos)) {
        this.offset = new Point(); // return null;
    } else {
        this.offset = pos.subtract(this.button.bounds.origin);
    }
    world = this.root();
    this.step = function () {
        var mousePos, newX, newY;
        if (world.hand.mouseButton) {
            mousePos = world.hand.bounds.origin;
            if (myself.orientation === 'vertical') {
                newX = myself.button.bounds.origin.x;
                newY = Math.max(
                    Math.min(
                        mousePos.y - myself.offset.y,
                        myself.bottom() - myself.button.height()
                    ),
                    myself.top()
                );
            } else {
                newY = myself.button.bounds.origin.y;
                newX = Math.max(
                    Math.min(
                        mousePos.x - myself.offset.x,
                        myself.right() - myself.button.width()
                    ),
                    myself.left()
                );
            }
            myself.button.setPosition(new Point(newX, newY));
            myself.updateValue();
        } else {
            this.step = null;
        }
    };
};

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

// InspectorMorph //////////////////////////////////////////////////////

// InspectorMorph: referenced constructors

var ListMorph;
var TriggerMorph;

// InspectorMorph inherits from BoxMorph:

InspectorMorph.prototype = new BoxMorph();
InspectorMorph.prototype.constructor = InspectorMorph;
InspectorMorph.uber = BoxMorph.prototype;

// InspectorMorph instance creation:

function InspectorMorph(target) {
    this.init(target);
}

InspectorMorph.prototype.init = function (target) {
    // additional properties:
    this.target = target;
    this.currentProperty = null;
    this.showing = 'attributes';
    this.markOwnProperties = false;
    this.hasUserEditedDetails = false;

    // initialize inherited properties:
    InspectorMorph.uber.init.call(this);

    // override inherited properties:
    this.silentSetExtent(
        new Point(
            MorphicPreferences.handleSize * 20,
            MorphicPreferences.handleSize * 20 * 2 / 3
        )
    );
    this.isDraggable = true;
    this.border = 1;
    this.edge = MorphicPreferences.isFlat ? 1 : 5;
    this.color = new Color(60, 60, 60);
    this.borderColor = new Color(95, 95, 95);
    this.fps = 25;
    this.drawNew();

    // panes:
    this.label = null;
    this.list = null;
    this.detail = null;
    this.work = null;
    this.buttonInspect = null;
    this.buttonClose = null;
    this.buttonSubset = null;
    this.buttonEdit = null;
    this.resizer = null;

    if (this.target) {
        this.buildPanes();
    }
};

InspectorMorph.prototype.setTarget = function (target) {
    this.target = target;
    this.currentProperty = null;
    this.buildPanes();
};

InspectorMorph.prototype.updateCurrentSelection = function () {
    var val, txt, cnts,
        sel = this.list.selected,
        currentTxt = this.detail.contents.children[0],
        root = this.root();

    if (root &&
        (root.keyboardReceiver instanceof CursorMorph) &&
        (root.keyboardReceiver.target === currentTxt)) {
        this.hasUserEditedDetails = true;
        return;
    }
    if (isNil(sel) || this.hasUserEditedDetails) {return; }
    val = this.target[sel];
    this.currentProperty = val;
    if (isNil(val)) {
        txt = 'NULL';
    } else if (isString(val)) {
        txt = val;
    } else {
        txt = val.toString();
    }
    if (currentTxt.text === txt) {return; }
    cnts = new TextMorph(txt);
    cnts.isEditable = true;
    cnts.enableSelecting();
    cnts.setReceiver(this.target);
    this.detail.setContents(cnts);
};

InspectorMorph.prototype.buildPanes = function () {
    var attribs = [], property, myself = this, ctrl, ev, doubleClickAction;

    // remove existing panes
    this.children.forEach(function (m) {
        if (m !== this.work) { // keep work pane around
            m.destroy();
        }
    });
    this.children = [];

    // label
    this.label = new TextMorph(this.target.toString());
    this.label.fontSize = MorphicPreferences.menuFontSize;
    this.label.isBold = true;
    this.label.color = new Color(255, 255, 255);
    this.label.drawNew();
    this.add(this.label);

    // properties list
    for (property in this.target) {
        if (property) { // dummy condition, to be refined
            attribs.push(property);
        }
    }
    if (this.showing === 'attributes') {
        attribs = attribs.filter(function (prop) {
            return typeof myself.target[prop] !== 'function';
        });
    } else if (this.showing === 'methods') {
        attribs = attribs.filter(function (prop) {
            return typeof myself.target[prop] === 'function';
        });
    } // otherwise show all properties

    doubleClickAction = function () {
        var world, inspector;
        if (!isObject(myself.currentProperty)) {return; }
        world = myself.world();
        inspector = new InspectorMorph(
            myself.currentProperty
        );
        inspector.setPosition(world.hand.position());
        inspector.keepWithin(world);
        world.add(inspector);
        inspector.changed();
    };

    this.list = new ListMorph(
        this.target instanceof Array ? attribs : attribs.sort(),
        null, // label getter
        this.markOwnProperties ?
            [ // format list
                [ // format element: [color, predicate(element]
                    new Color(0, 0, 180),
                    function (element) {
                        return Object.prototype.hasOwnProperty.call(
                            myself.target,
                            element
                        );
                    }
                ]
            ]
            : null,
        doubleClickAction
    );

    this.list.action = function () {
        myself.hasUserEditedDetails = false;
        myself.updateCurrentSelection();
    };

    this.list.hBar.alpha = 0.6;
    this.list.vBar.alpha = 0.6;
    this.list.contents.step = null;
    this.add(this.list);

    // details pane
    this.detail = new ScrollFrameMorph();
    this.detail.acceptsDrops = false;
    this.detail.contents.acceptsDrops = false;
    this.detail.isTextLineWrapping = true;
    this.detail.color = new Color(255, 255, 255);
    this.detail.hBar.alpha = 0.6;
    this.detail.vBar.alpha = 0.6;
    ctrl = new TextMorph('');
    ctrl.isEditable = true;
    ctrl.enableSelecting();
    ctrl.setReceiver(this.target);
    this.detail.setContents(ctrl);
    this.add(this.detail);

    // work ('evaluation') pane
    // don't refresh the work pane if it already exists
    if (this.work === null) {
        this.work = new ScrollFrameMorph();
        this.work.acceptsDrops = false;
        this.work.contents.acceptsDrops = false;
        this.work.isTextLineWrapping = true;
        this.work.color = new Color(255, 255, 255);
        this.work.hBar.alpha = 0.6;
        this.work.vBar.alpha = 0.6;
        ev = new TextMorph('');
        ev.isEditable = true;
        ev.enableSelecting();
        ev.setReceiver(this.target);
        this.work.setContents(ev);
    }
    this.add(this.work);

    // properties button
    this.buttonSubset = new TriggerMorph();
    this.buttonSubset.labelString = 'show...';
    this.buttonSubset.action = function () {
        var menu;
        menu = new MenuMorph();
        menu.addItem(
            'attributes',
            function () {
                myself.showing = 'attributes';
                myself.buildPanes();
            }
        );
        menu.addItem(
            'methods',
            function () {
                myself.showing = 'methods';
                myself.buildPanes();
            }
        );
        menu.addItem(
            'all',
            function () {
                myself.showing = 'all';
                myself.buildPanes();
            }
        );
        menu.addLine();
        menu.addItem(
            (myself.markOwnProperties ?
                'un-mark own' : 'mark own'),
            function () {
                myself.markOwnProperties = !myself.markOwnProperties;
                myself.buildPanes();
            },
            'highlight\n\'own\' properties'
        );
        menu.popUpAtHand(myself.world());
    };
    this.add(this.buttonSubset);

    // inspect button
    this.buttonInspect = new TriggerMorph();
    this.buttonInspect.labelString = 'inspect...';
    this.buttonInspect.action = function () {
        var menu, world, inspector;
        if (isObject(myself.currentProperty)) {
            menu = new MenuMorph();
            menu.addItem(
                'in new inspector...',
                function () {
                    world = myself.world();
                    inspector = new InspectorMorph(
                        myself.currentProperty
                    );
                    inspector.setPosition(world.hand.position());
                    inspector.keepWithin(world);
                    world.add(inspector);
                    inspector.changed();
                }
            );
            menu.addItem(
                'here...',
                function () {
                    myself.setTarget(myself.currentProperty);
                }
            );
            menu.popUpAtHand(myself.world());
        } else {
            myself.inform(
                (myself.currentProperty === null ?
                    'null' : typeof myself.currentProperty) +
                '\nis not inspectable'
            );
        }
    };
    this.add(this.buttonInspect);

    // edit button

    this.buttonEdit = new TriggerMorph();
    this.buttonEdit.labelString = 'edit...';
    this.buttonEdit.action = function () {
        var menu;
        menu = new MenuMorph(myself);
        menu.addItem("save", 'save', 'accept changes');
        menu.addLine();
        menu.addItem("add property...", 'addProperty');
        menu.addItem("rename...", 'renameProperty');
        menu.addItem("remove...", 'removeProperty');
        menu.popUpAtHand(myself.world());
    };
    this.add(this.buttonEdit);

    // close button
    this.buttonClose = new TriggerMorph();
    this.buttonClose.labelString = 'close';
    this.buttonClose.action = function () {
        myself.destroy();
    };
    this.add(this.buttonClose);

    // resizer
    this.resizer = new HandleMorph(
        this,
        150,
        100,
        this.edge,
        this.edge
    );

    // update layout
    this.fixLayout();
};

InspectorMorph.prototype.fixLayout = function () {
    var x, y, r, b, w, h;

    Morph.prototype.trackChanges = false;

    // label
    x = this.left() + this.edge;
    y = this.top() + this.edge;
    r = this.right() - this.edge;
    w = r - x;
    this.label.setPosition(new Point(x, y));
    this.label.setWidth(w);
    if (this.label.height() > (this.height() - 50)) {
        this.silentSetHeight(this.label.height() + 50);
        this.drawNew();
        this.changed();
        this.resizer.drawNew();
    }

    // list
    y = this.label.bottom() + 2;
    w = Math.min(
        Math.floor(this.width() / 3),
        this.list.listContents.width()
    );

    w -= this.edge;
    b = this.bottom() - (2 * this.edge) -
        MorphicPreferences.handleSize;
    h = b - y;
    this.list.setPosition(new Point(x, y));
    this.list.setExtent(new Point(w, h));

    // detail
    x = this.list.right() + this.edge;
    r = this.right() - this.edge;
    w = r - x;
    this.detail.setPosition(new Point(x, y));
    this.detail.setExtent(new Point(w, (h * 2 / 3) - this.edge));

    // work
    y = this.detail.bottom() + this.edge;
    this.work.setPosition(new Point(x, y));
    this.work.setExtent(new Point(w, h / 3));

    // properties button
    x = this.list.left();
    y = this.list.bottom() + this.edge;
    w = this.list.width();
    h = MorphicPreferences.handleSize;
    this.buttonSubset.setPosition(new Point(x, y));
    this.buttonSubset.setExtent(new Point(w, h));

    // inspect button
    x = this.detail.left();
    w = this.detail.width() - this.edge -
        MorphicPreferences.handleSize;
    w = w / 3 - this.edge / 3;
    this.buttonInspect.setPosition(new Point(x, y));
    this.buttonInspect.setExtent(new Point(w, h));

    // edit button
    x = this.buttonInspect.right() + this.edge;
    this.buttonEdit.setPosition(new Point(x, y));
    this.buttonEdit.setExtent(new Point(w, h));

    // close button
    x = this.buttonEdit.right() + this.edge;
    r = this.detail.right() - this.edge -
        MorphicPreferences.handleSize;
    w = r - x;
    this.buttonClose.setPosition(new Point(x, y));
    this.buttonClose.setExtent(new Point(w, h));

    Morph.prototype.trackChanges = true;
    this.changed();

};

InspectorMorph.prototype.setExtent = function (aPoint) {
    InspectorMorph.uber.setExtent.call(this, aPoint);
    this.fixLayout();
};

// InspectorMorph editing ops:

InspectorMorph.prototype.save = function () {
    var txt = this.detail.contents.children[0].text.toString(),
        prop = this.list.selected;
    try {
        // this.target[prop] = evaluate(txt);
        this.target.evaluateString('this.' + prop + ' = ' + txt);
        this.hasUserEditedDetails = false;
        if (this.target.drawNew) {
            this.target.changed();
            this.target.drawNew();
            this.target.changed();
        }
    } catch (err) {
        this.inform(err);
    }
};

InspectorMorph.prototype.addProperty = function () {
    var myself = this;
    this.prompt(
        'new property name:',
        function (prop) {
            if (prop) {
                myself.target[prop] = null;
                myself.buildPanes();
                if (myself.target.drawNew) {
                    myself.target.changed();
                    myself.target.drawNew();
                    myself.target.changed();
                }
            }
        },
        this,
        'property' // Chrome cannot handle empty strings (others do)
    );
};

InspectorMorph.prototype.renameProperty = function () {
    var myself = this,
        propertyName = this.list.selected;
    this.prompt(
        'property name:',
        function (prop) {
            try {
                delete (myself.target[propertyName]);
                myself.target[prop] = myself.currentProperty;
            } catch (err) {
                myself.inform(err);
            }
            myself.buildPanes();
            if (myself.target.drawNew) {
                myself.target.changed();
                myself.target.drawNew();
                myself.target.changed();
            }
        },
        this,
        propertyName
    );
};

InspectorMorph.prototype.removeProperty = function () {
    var prop = this.list.selected;
    try {
        delete (this.target[prop]);
        this.currentProperty = null;
        this.buildPanes();
        if (this.target.drawNew) {
            this.target.changed();
            this.target.drawNew();
            this.target.changed();
        }
    } catch (err) {
        this.inform(err);
    }
};

// InspectorMorph stepping

InspectorMorph.prototype.step = function () {
    this.updateCurrentSelection();
    var lbl = this.target.toString();
    if (this.label.text === lbl) {return; }
    this.label.text = lbl;
    this.label.drawNew();
    this.fixLayout();
};

// InspectorMorph duplicating:

InspectorMorph.prototype.updateReferences = function (map) {
    var active = this.list.activeIndex();
    InspectorMorph.uber.updateReferences.call(this, map);
    this.buildPanes();
    this.list.activateIndex(active);
};

// MenuMorph ///////////////////////////////////////////////////////////

// MenuMorph: referenced constructors

var MenuItemMorph;

// MenuMorph inherits from BoxMorph:

MenuMorph.prototype = new BoxMorph();
MenuMorph.prototype.constructor = MenuMorph;
MenuMorph.uber = BoxMorph.prototype;

// MenuMorph instance creation:

function MenuMorph(target, title, environment, fontSize) {
    this.init(target, title, environment, fontSize);

    /*
    if target is a function, use it as callback:
    execute target as callback function with the action property
    of the triggered MenuItem as argument.
    Use the environment, if it is specified.
    Note: if action is also a function, instead of becoming
    the argument itself it will be called to answer the argument.
    For selections, Yes/No Choices etc.

    else (if target is not a function):

        if action is a function:
        execute the action with target as environment (can be null)
        for lambdafied (inline) actions

        else if action is a String:
        treat it as function property of target and execute it
        for selector-like actions
    */
}

MenuMorph.prototype.init = function (target, title, environment, fontSize) {
    // additional properties:
    this.target = target;
    this.title = title || null;
    this.environment = environment || null;
    this.fontSize = fontSize || null;
    this.items = [];
    this.label = null;
    this.world = null;
    this.isListContents = false;
    this.hasFocus = false;
    this.selection = null;
    this.submenu = null;

    // initialize inherited properties:
    MenuMorph.uber.init.call(this);

    // override inherited properties:
    this.isDraggable = false;

    // immutable properties:
    this.border = null;
    this.edge = null;
};

MenuMorph.prototype.addItem = function (
    labelString,
    action,
    hint,
    color,
    bold, // bool
    italic, // bool
    doubleClickAction, // optional, when used as list contents
    shortcut // optional string, icon (Morph or Canvas) or tuple [icon, string]
) {
    /*
    labelString is normally a single-line string. But it can also be one
    of the following:

        * a multi-line string (containing line breaks)
        * an icon (either a Morph or a Canvas)
        * a tuple of format: [icon, string]
    */
    this.items.push([
        localize(labelString || 'close'),
        action || nop,
        hint,
        color,
        bold || false,
        italic || false,
        doubleClickAction,
        shortcut]);
};

MenuMorph.prototype.addMenu = function (label, aMenu, indicator) {
    this.addPair(label, aMenu, isNil(indicator) ? '\u25ba' : indicator);
};

MenuMorph.prototype.addPair = function (label, action, shortcut, hint) {
    this.addItem(label, action, hint, null, null, null, null, shortcut);
};

MenuMorph.prototype.addLine = function (width) {
    this.items.push([0, width || 1]);
};

MenuMorph.prototype.createLabel = function () {
    var text;
    if (this.label !== null) {
        this.label.destroy();
    }
    text = new TextMorph(
        localize(this.title),
        this.fontSize || MorphicPreferences.menuFontSize,
        MorphicPreferences.menuFontName,
        true,
        false,
        'center'
    );
    text.alignment = 'center';
    text.color = new Color(255, 255, 255);
    text.backgroundColor = this.borderColor;
    text.drawNew();
    this.label = new BoxMorph(3, 0);
    if (MorphicPreferences.isFlat) {
        this.label.edge = 0;
    }
    this.label.color = this.borderColor;
    this.label.borderColor = this.borderColor;
    this.label.setExtent(text.extent().add(4));
    this.label.drawNew();
    this.label.add(text);
    this.label.text = text;
};

MenuMorph.prototype.drawNew = function () {
    var myself = this,
        item,
        fb,
        x,
        y,
        isLine = false;

    this.children.forEach(function (m) {
        m.destroy();
    });
    this.children = [];
    if (!this.isListContents) {
        this.edge = MorphicPreferences.isFlat ? 0 : 5;
        this.border = MorphicPreferences.isFlat ? 1 : 2;
    }
    this.color = new Color(255, 255, 255);
    this.borderColor = new Color(60, 60, 60);
    this.silentSetExtent(new Point(0, 0));

    y = 2;
    x = this.left() + 4;
    if (!this.isListContents) {
        if (this.title) {
            this.createLabel();
            this.label.setPosition(this.bounds.origin.add(4));
            this.add(this.label);
            y = this.label.bottom();
        } else {
            y = this.top() + 4;
        }
    }
    y += 1;
    this.items.forEach(function (tuple) {
        isLine = false;
        if (tuple instanceof StringFieldMorph ||
            tuple instanceof ColorPickerMorph ||
            tuple instanceof SliderMorph ||
            tuple instanceof DialMorph) {
            item = tuple;
        } else if (tuple[0] === 0) {
            isLine = true;
            item = new Morph();
            item.color = myself.borderColor;
            item.setHeight(tuple[1]);
        } else {
            item = new MenuItemMorph(
                myself.target,
                tuple[1],
                tuple[0],
                myself.fontSize || MorphicPreferences.menuFontSize,
                MorphicPreferences.menuFontName,
                myself.environment,
                tuple[2], // bubble help hint
                tuple[3], // color
                tuple[4], // bold
                tuple[5], // italic
                tuple[6], // doubleclick action
                tuple[7] // shortcut
            );
        }
        if (isLine) {
            y += 1;
        }
        item.setPosition(new Point(x, y));
        myself.add(item);
        y = y + item.height();
        if (isLine) {
            y += 1;
        }
    });

    fb = this.fullBounds();
    this.silentSetExtent(fb.extent().add(4));
    this.adjustWidths();
    MenuMorph.uber.drawNew.call(this);
};

MenuMorph.prototype.maxWidth = function () {
    var w = 0;

    if (this.parent instanceof FrameMorph) {
        if (this.parent.scrollFrame instanceof ScrollFrameMorph) {
            w = this.parent.scrollFrame.width();
        }
    }
    this.children.forEach(function (item) {
        if (item instanceof MenuItemMorph) {
            w = Math.max(
                w,
                item.label.width() + 8 +
                (item.shortcut ? item.shortcut.width() + 4 : 0)
            );
        } else if ((item instanceof StringFieldMorph) ||
            (item instanceof ColorPickerMorph) ||
            (item instanceof SliderMorph) ||
            (item instanceof DialMorph)) {
            w = Math.max(w, item.width());
        }
    });
    if (this.label) {
        w = Math.max(w, this.label.width());
    }
    return w;
};

MenuMorph.prototype.adjustWidths = function () {
    var w = this.maxWidth(),
        isSelected,
        myself = this;
    this.children.forEach(function (item) {
        if (!(item instanceof DialMorph)) {
            item.silentSetWidth(w);
        }
        if (item instanceof MenuItemMorph) {
            item.fixLayout();
            isSelected = (item.image === item.pressImage);
            item.createBackgrounds();
            if (isSelected) {
                item.image = item.pressImage;
            }
        } else {
            item.drawNew();
            if (item === myself.label) {
                item.text.setPosition(
                    item.center().subtract(
                        item.text.extent().floorDivideBy(2)
                    )
                );
            }
        }
    });
};

MenuMorph.prototype.unselectAllItems = function () {
    this.children.forEach(function (item) {
        if (item instanceof MenuItemMorph) {
            item.image = item.normalImage;
        } else if (item instanceof ScrollFrameMorph) {
            item.contents.children.forEach(function (morph) {
                if (morph instanceof MenuItemMorph) {
                    morph.image = morph.normalImage;
                }
            });
        }
    });
    this.changed();
};

// MenuMorph popping up

MenuMorph.prototype.popup = function (world, pos) {
    var scroller;

    this.drawNew();
    this.setPosition(pos);
    this.addShadow(new Point(2, 2), 80);
    this.keepWithin(world);

    if (this.bottom() > world.bottom()) {
        // scroll menu items if the menu is taller than the world
        this.removeShadow();
        scroller = this.scroll();
        this.bounds.corner.y = world.bottom() - 2;
        MenuMorph.uber.drawNew.call(this);
        this.addShadow(new Point(2, 2), 80);
        scroller.setHeight(world.bottom() - scroller.top() - 6);
        scroller.adjustScrollBars(); // ?
    }

    if (world.activeMenu) {
        world.activeMenu.destroy();
    }
    if (this.items.length < 1 && !this.title) { // don't show empty menus
        return;
    }
    world.add(this);
    world.activeMenu = this;
    this.world = world; // optionally enable keyboard support
    this.fullChanged();
};

MenuMorph.prototype.scroll = function () {
    // private - move all items into a scroll frame
    var scroller = new ScrollFrameMorph(),
        start = this.label ? 1 : 0,
        first = this.children[start];

    scroller.setPosition(first.position());
    this.children.slice(start).forEach(function (morph) {
        scroller.addContents(morph);
    });
    this.add(scroller);
    scroller.setWidth(first.width());
    return scroller;
};

MenuMorph.prototype.popUpAtHand = function (world) {
    var wrrld = world || this.world;
    this.popup(wrrld, wrrld.hand.position());
};

MenuMorph.prototype.popUpCenteredAtHand = function (world) {
    var wrrld = world || this.world;
    this.drawNew();
    this.popup(
        wrrld,
        wrrld.hand.position().subtract(
            this.extent().floorDivideBy(2)
        )
    );
};

MenuMorph.prototype.popUpCenteredInWorld = function (world) {
    var wrrld = world || this.world;
    this.drawNew();
    this.popup(
        wrrld,
        wrrld.center().subtract(
            this.extent().floorDivideBy(2)
        )
    );
};

// MenuMorph submenus

MenuMorph.prototype.closeRootMenu = function () {
    if (this.parent instanceof MenuMorph) {
        this.parent.closeRootMenu();
    } else {
        this.destroy();
    }
};

MenuMorph.prototype.closeSubmenu = function () {
    if (this.submenu) {
        this.submenu.destroy();
        this.submenu = null;
        this.unselectAllItems();
    }
};

// MenuMorph keyboard accessibility

MenuMorph.prototype.getFocus = function () {
    this.world.keyboardReceiver = this;
    this.selection = null;
    this.selectFirst();
    this.hasFocus = true;
};

MenuMorph.prototype.processKeyDown = function (event) {
    // console.log(event.keyCode);
    switch (event.keyCode) {
        case 13: // 'enter'
        case 32: // 'space'
            if (this.selection) {
                this.selection.mouseClickLeft();
                if (this.submenu) {
                    this.submenu.getFocus();
                }
            }
            return;
        case 27: // 'esc'
            return this.destroy();
        case 37: // 'left arrow'
            return this.leaveSubmenu();
        case 38: // 'up arrow'
            return this.selectUp();
        case 39: // 'right arrow'
            return this.enterSubmenu();
        case 40: // 'down arrow'
            return this.selectDown();
        default:
            nop();
    }
};

MenuMorph.prototype.processKeyUp = function (event) {
    nop(event);
};

MenuMorph.prototype.processKeyPress = function (event) {
    nop(event);
};

MenuMorph.prototype.selectFirst = function () {
    var scroller, items, i;

    scroller = detect(this.children, function (morph) {
        return morph instanceof ScrollFrameMorph;
    });
    items = scroller ? scroller.contents.children : this.children;
    for (i = 0; i < items.length; i += 1) {
        if (items[i] instanceof MenuItemMorph) {
            this.select(items[i]);
            return;
        }
    }
};

MenuMorph.prototype.selectUp = function () {
    var scroller, triggers, idx;

    scroller = detect(this.children, function (morph) {
        return morph instanceof ScrollFrameMorph;
    });
    triggers = (scroller ? scroller.contents.children : this.children).filter(
        function (each) {
            return each instanceof MenuItemMorph;
        }
    );
    if (!this.selection) {
        if (triggers.length) {
            this.select(triggers[0]);
        }
        return;
    }
    idx = triggers.indexOf(this.selection) - 1;
    if (idx < 0) {
        idx = triggers.length - 1;
    }
    this.select(triggers[idx]);
};

MenuMorph.prototype.selectDown = function () {
    var scroller, triggers, idx;

    scroller = detect(this.children, function (morph) {
        return morph instanceof ScrollFrameMorph;
    });
    triggers = (scroller ? scroller.contents.children : this.children).filter(
        function (each) {
            return each instanceof MenuItemMorph;
        }
    );
    if (!this.selection) {
        if (triggers.length) {
            this.select(triggers[0]);
        }
        return;
    }
    idx = triggers.indexOf(this.selection) + 1;
    if (idx >= triggers.length) {
        idx = 0;
    }
    this.select(triggers[idx]);
};

MenuMorph.prototype.enterSubmenu = function () {
    if (this.selection && this.selection.action instanceof MenuMorph) {
        this.selection.popUpSubmenu();
        if (this.submenu) {
            this.submenu.getFocus();
        }
    }
};

MenuMorph.prototype.leaveSubmenu = function () {
    var menu = this.parent;
    if (this.parent instanceof MenuMorph) {
        menu.submenu = null;
        menu.hasFocus = true;
        this.destroy();
        menu.world.keyboardReceiver = menu;
    }
};

MenuMorph.prototype.select = function (aMenuItem) {
    this.unselectAllItems();
    aMenuItem.image = aMenuItem.highlightImage;
    aMenuItem.changed();
    aMenuItem.scrollIntoView();
    this.selection = aMenuItem;
};

MenuMorph.prototype.destroy = function () {
    if (this.hasFocus) {
        this.world.keyboardReceiver = null;
    }
    MenuMorph.uber.destroy.call(this);
};

// StringMorph /////////////////////////////////////////////////////////

// I am a single line of text

// StringMorph inherits from Morph:

StringMorph.prototype = new Morph();
StringMorph.prototype.constructor = StringMorph;
StringMorph.uber = Morph.prototype;

// StringMorph instance creation:

function StringMorph(
    text,
    fontSize,
    fontStyle,
    bold,
    italic,
    isNumeric,
    shadowOffset,
    shadowColor,
    color,
    fontName
) {
    this.init(
        text,
        fontSize,
        fontStyle,
        bold,
        italic,
        isNumeric,
        shadowOffset,
        shadowColor,
        color,
        fontName
    );
}

StringMorph.prototype.init = function (
    text,
    fontSize,
    fontStyle,
    bold,
    italic,
    isNumeric,
    shadowOffset,
    shadowColor,
    color,
    fontName
) {
    // additional properties:
    this.text = text || ((text === '') ? '' : 'StringMorph');
    this.fontSize = fontSize || 12;
    this.fontName = fontName || MorphicPreferences.globalFontFamily;
    this.fontStyle = fontStyle || 'sans-serif';
    this.isBold = bold || false;
    this.isItalic = italic || false;
    this.isEditable = false;
    this.isNumeric = isNumeric || false;
    this.isPassword = false;
    this.shadowOffset = shadowOffset || new Point(0, 0);
    this.shadowColor = shadowColor || null;
    this.isShowingBlanks = false;
    this.blanksColor = new Color(180, 140, 140);

    // additional properties for text-editing:
    this.isScrollable = true; // scrolls into view when edited
    this.currentlySelecting = false;
    this.startMark = 0;
    this.endMark = 0;
    this.markedTextColor = new Color(255, 255, 255);
    this.markedBackgoundColor = new Color(60, 60, 120);

    // initialize inherited properties:
    StringMorph.uber.init.call(this, true);

    // override inherited properites:
    this.color = color || new Color(0, 0, 0);
    this.noticesTransparentClick = true;
    this.drawNew();
};

StringMorph.prototype.toString = function () {
    // e.g. 'a StringMorph("Hello World")'
    return 'a ' +
        (this.constructor.name ||
            this.constructor.toString().split(' ')[1].split('(')[0]) +
        '("' + this.text.slice(0, 30) + '...")';
};

StringMorph.prototype.password = function (letter, length) {
    var ans = '',
        i;
    for (i = 0; i < length; i += 1) {
        ans += letter;
    }
    return ans;
};

StringMorph.prototype.font = function () {
    // answer a font string, e.g. 'bold italic 12px sans-serif'
    var font = '';
    if (this.isBold) {
        font = font + 'bold ';
    }
    if (this.isItalic) {
        font = font + 'italic ';
    }
    return font +
        this.fontSize + 'px ' +
        (this.fontName ? this.fontName + ', ' : '') +
        this.fontStyle;
};

StringMorph.prototype.drawNew = function () {
    var context, width, start, stop, i, p, c, x, y,
        shadowOffset = this.shadowOffset || new Point(),
        txt = this.isPassword ?
            this.password('*', this.text.length) : this.text;

    // initialize my surface property
    this.image = newCanvas();
    context = this.image.getContext('2d');
    context.font = this.font();

    // set my extent
    width = Math.max(
        context.measureText(txt).width + Math.abs(shadowOffset.x),
        1
    );
    this.bounds.corner = this.bounds.origin.add(
        new Point(
            width,
            fontHeight(this.fontSize) + Math.abs(shadowOffset.y)
        )
    );
    this.image.width = width;
    this.image.height = this.height();

    // prepare context for drawing text
    context.font = this.font();
    context.textAlign = 'left';
    context.textBaseline = 'bottom';

    // first draw the shadow, if any
    if (this.shadowColor) {
        x = Math.max(shadowOffset.x, 0);
        y = Math.max(shadowOffset.y, 0);
        context.fillStyle = this.shadowColor.toString();
        context.fillText(txt, x, fontHeight(this.fontSize) + y);
    }

    // now draw the actual text
    x = Math.abs(Math.min(shadowOffset.x, 0));
    y = Math.abs(Math.min(shadowOffset.y, 0));
    context.fillStyle = this.color.toString();

    if (this.isShowingBlanks) {
        this.renderWithBlanks(context, x, fontHeight(this.fontSize) + y);
    } else {
        context.fillText(txt, x, fontHeight(this.fontSize) + y);
    }

    // draw the selection
    start = Math.min(this.startMark, this.endMark);
    stop = Math.max(this.startMark, this.endMark);
    for (i = start; i < stop; i += 1) {
        p = this.slotPosition(i).subtract(this.position());
        c = txt.charAt(i);
        context.fillStyle = this.markedBackgoundColor.toString();
        context.fillRect(p.x, p.y, context.measureText(c).width + 1 + x,
            fontHeight(this.fontSize) + y);
        context.fillStyle = this.markedTextColor.toString();
        context.fillText(c, p.x + x, fontHeight(this.fontSize) + y);
    }

    // notify my parent of layout change
    if (this.parent) {
        if (this.parent.fixLayout) {
            this.parent.fixLayout();
        }
    }
};

StringMorph.prototype.renderWithBlanks = function (context, startX, y) {
    var space = context.measureText(' ').width,
        blank = newCanvas(new Point(space, this.height())),
        ctx = blank.getContext('2d'),
        words = this.text.split(' '),
        x = startX || 0,
        isFirst = true;

    // create the blank form
    ctx.fillStyle = this.blanksColor.toString();
    ctx.arc(
        space / 2,
        blank.height / 2,
        space / 2,
        radians(0),
        radians(360)
    );
    ctx.fill();

    function drawBlank() {
        context.drawImage(blank, x, 0);
        x += space;
    }

    // render my text inserting blanks
    words.forEach(function (word) {
        if (!isFirst) {
            drawBlank();
        }
        isFirst = false;
        if (word !== '') {
            context.fillText(word, x, y);
            x += context.measureText(word).width;
        }
    });
};

// StringMorph measuring:

StringMorph.prototype.slotPosition = function (slot) {
    // answer the position point of the given index ("slot")
    // where the cursor should be placed
    var txt = this.isPassword ?
        this.password('*', this.text.length) : this.text,
        dest = Math.min(Math.max(slot, 0), txt.length),
        context = this.image.getContext('2d'),
        xOffset,
        x,
        y,
        idx;

    xOffset = 0;
    for (idx = 0; idx < dest; idx += 1) {
        xOffset += context.measureText(txt[idx]).width;
    }
    this.pos = dest;
    x = this.left() + xOffset;
    y = this.top();
    return new Point(x, y);
};

StringMorph.prototype.slotAt = function (aPoint) {
    // answer the slot (index) closest to the given point taking
    // in account how far from the middle of the character it is,
    // so the cursor can be moved accordingly

    var txt = this.isPassword ?
        this.password('*', this.text.length) : this.text,
        idx = 0,
        charX = 0,
        context = this.image.getContext('2d');

    while (aPoint.x - this.left() > charX) {
        charX += context.measureText(txt[idx]).width;
        idx += 1;
        if (idx === txt.length) {
            if ((context.measureText(txt).width -
                (context.measureText(txt[idx - 1]).width / 2)) <
                (aPoint.x - this.left())) {
                return idx;
            }
        }
    }

    // see where our click fell with respect to the middle of the char
    if (aPoint.x - this.left() >
        charX - context.measureText(txt[idx - 1]).width / 2) {
        return idx;
    } else {
        return idx - 1;
    }
};

StringMorph.prototype.upFrom = function (slot) {
    // answer the slot above the given one
    return slot;
};

StringMorph.prototype.downFrom = function (slot) {
    // answer the slot below the given one
    return slot;
};

StringMorph.prototype.startOfLine = function () {
    // answer the first slot (index) of the line for the given slot
    return 0;
};

StringMorph.prototype.endOfLine = function () {
    // answer the slot (index) indicating the EOL for the given slot
    return this.text.length;
};

StringMorph.prototype.previousWordFrom = function (aSlot) {
    // answer the slot (index) slots indicating the position of the
    // previous word to the left of aSlot
    var index = aSlot - 1;

    // while the current character is non-word one, we skip it, so that
    // if we are in the middle of a non-alphanumeric sequence, we'll get
    // right to the beginning of the previous word
    while (index > 0 && !isWordChar(this.text[index])) {
        index -= 1;
    }

    // while the current character is a word one, we skip it until we
    // find the beginning of the current word
    while (index > 0 && isWordChar(this.text[index - 1])) {
        index -= 1;
    }

    return index;
};

StringMorph.prototype.nextWordFrom = function (aSlot) {
    var index = aSlot;

    while (index < this.endOfLine() && !isWordChar(this.text[index])) {
        index += 1;
    }

    while (index < this.endOfLine() && isWordChar(this.text[index])) {
        index += 1;
    }

    return index;
};

StringMorph.prototype.rawHeight = function () {
    // answer my corrected fontSize
    return this.height() / 1.2;
};

// StringMorph menus:

StringMorph.prototype.developersMenu = function () {
    var menu = StringMorph.uber.developersMenu.call(this);

    menu.addLine();
    menu.addItem("edit", 'edit');
    menu.addItem(
        "font size...",
        function () {
            this.prompt(
                menu.title + '\nfont\nsize:',
                this.setFontSize,
                this,
                this.fontSize.toString(),
                null,
                6,
                500,
                true
            );
        },
        'set this String\'s\nfont point size'
    );
    if (this.fontStyle !== 'serif') {
        menu.addItem("serif", 'setSerif');
    }
    if (this.fontStyle !== 'sans-serif') {
        menu.addItem("sans-serif", 'setSansSerif');
    }
    if (this.isBold) {
        menu.addItem("normal weight", 'toggleWeight');
    } else {
        menu.addItem("bold", 'toggleWeight');
    }
    if (this.isItalic) {
        menu.addItem("normal style", 'toggleItalic');
    } else {
        menu.addItem("italic", 'toggleItalic');
    }
    if (this.isShowingBlanks) {
        menu.addItem("hide blanks", 'toggleShowBlanks');
    } else {
        menu.addItem("show blanks", 'toggleShowBlanks');
    }
    if (this.isPassword) {
        menu.addItem("show characters", 'toggleIsPassword');
    } else {
        menu.addItem("hide characters", 'toggleIsPassword');
    }
    return menu;
};

StringMorph.prototype.toggleIsDraggable = function () {
    // for context menu demo purposes
    this.isDraggable = !this.isDraggable;
    if (this.isDraggable) {
        this.disableSelecting();
    } else {
        this.enableSelecting();
    }
};

StringMorph.prototype.toggleShowBlanks = function () {
    this.isShowingBlanks = !this.isShowingBlanks;
    this.changed();
    this.drawNew();
    this.changed();
};

StringMorph.prototype.toggleWeight = function () {
    this.isBold = !this.isBold;
    this.changed();
    this.drawNew();
    this.changed();
};

StringMorph.prototype.toggleItalic = function () {
    this.isItalic = !this.isItalic;
    this.changed();
    this.drawNew();
    this.changed();
};

StringMorph.prototype.toggleIsPassword = function () {
    this.isPassword = !this.isPassword;
    this.changed();
    this.drawNew();
    this.changed();
};

StringMorph.prototype.setSerif = function () {
    this.fontStyle = 'serif';
    this.changed();
    this.drawNew();
    this.changed();
};

StringMorph.prototype.setSansSerif = function () {
    this.fontStyle = 'sans-serif';
    this.changed();
    this.drawNew();
    this.changed();
};

StringMorph.prototype.setFontSize = function (size) {
    // for context menu demo purposes
    var newSize;
    if (typeof size === 'number') {
        this.fontSize = Math.round(Math.min(Math.max(size, 4), 500));
    } else {
        newSize = parseFloat(size);
        if (!isNaN(newSize)) {
            this.fontSize = Math.round(
                Math.min(Math.max(newSize, 4), 500)
            );
        }
    }
    this.changed();
    this.drawNew();
    this.changed();
};

StringMorph.prototype.setText = function (size) {
    // for context menu demo purposes
    this.text = Math.round(size).toString();
    this.changed();
    this.drawNew();
    this.changed();
};

StringMorph.prototype.numericalSetters = function () {
    // for context menu demo purposes
    return [
        'setLeft',
        'setTop',
        'setAlphaScaled',
        'setFontSize',
        'setText'
    ];
};

// StringMorph editing:

StringMorph.prototype.edit = function () {
    this.root().edit(this);
};

StringMorph.prototype.selection = function () {
    var start, stop;
    start = Math.min(this.startMark, this.endMark);
    stop = Math.max(this.startMark, this.endMark);
    return this.text.slice(start, stop);
};

StringMorph.prototype.selectionStartSlot = function () {
    return Math.min(this.startMark, this.endMark);
};

StringMorph.prototype.clearSelection = function () {
    if (!this.currentlySelecting &&
        isNil(this.startMark) &&
        isNil(this.endMark)) {
        return;
    }
    this.currentlySelecting = false;
    this.startMark = null;
    this.endMark = null;
    this.drawNew();
    this.changed();
};

StringMorph.prototype.deleteSelection = function () {
    var start, stop, text;
    text = this.text;
    start = Math.min(this.startMark, this.endMark);
    stop = Math.max(this.startMark, this.endMark);
    this.text = text.slice(0, start) + text.slice(stop);
    this.changed();
    this.clearSelection();
};

StringMorph.prototype.selectAll = function () {
    var cursor;
    if (this.isEditable) {
        this.startMark = 0;
        cursor = this.root().cursor;
        if (cursor) {
            cursor.gotoSlot(this.text.length);
        }
        this.endMark = this.text.length;
        this.drawNew();
        this.changed();
    }
};

StringMorph.prototype.mouseDownLeft = function (pos) {
    if (this.world().currentKey === 16) {
        this.shiftClick(pos);
    } else if (this.isEditable) {
        this.clearSelection();
    } else {
        this.escalateEvent('mouseDownLeft', pos);
    }
};

StringMorph.prototype.shiftClick = function (pos) {
    var cursor = this.root().cursor;

    if (cursor) {
        if (!this.startMark) {
            this.startMark = cursor.slot;
        }
        cursor.gotoPos(pos);
        this.endMark = cursor.slot;
        this.drawNew();
        this.changed();
    }
    this.currentlySelecting = false;
    this.escalateEvent('mouseDownLeft', pos);
};

StringMorph.prototype.mouseClickLeft = function (pos) {
    var cursor;
    if (this.isEditable) {
        if (!this.currentlySelecting) {
            this.edit(); // creates a new cursor
        }
        cursor = this.root().cursor;
        if (cursor) {
            cursor.gotoPos(pos);
        }
        this.currentlySelecting = true;
    } else {
        this.escalateEvent('mouseClickLeft', pos);
    }
};

StringMorph.prototype.mouseDoubleClick = function (pos) {
    // selects the word at pos
    // if there is no word, we select whatever is between
    // the previous and next words
    var slot = this.slotAt(pos);

    if (this.isEditable) {
        this.edit();

        if (slot === this.text.length) {
            slot -= 1;
        }

        if (this.text[slot] && isWordChar(this.text[slot])) {
            this.selectWordAt(slot);
        } else if (this.text[slot]) {
            this.selectBetweenWordsAt(slot);
        } else {
            // special case for when we click right after the
            // last slot in multi line TextMorphs
            this.selectAll();
        }
    } else {
        this.escalateEvent('mouseDoubleClick', pos);
    }
};

StringMorph.prototype.selectWordAt = function (slot) {
    var cursor = this.root().cursor;

    if (slot === 0 || isWordChar(this.text[slot - 1])) {
        cursor.gotoSlot(this.previousWordFrom(slot));
        this.startMark = cursor.slot;
        this.endMark = this.nextWordFrom(cursor.slot);
    } else {
        cursor.gotoSlot(slot);
        this.startMark = slot;
        this.endMark = this.nextWordFrom(slot);
    }

    this.drawNew();
    this.changed();
};

StringMorph.prototype.selectBetweenWordsAt = function (slot) {
    var cursor = this.root().cursor;

    cursor.gotoSlot(this.nextWordFrom(this.previousWordFrom(slot)));
    this.startMark = cursor.slot;
    this.endMark = cursor.slot;

    while (this.endMark < this.text.length
    && !isWordChar(this.text[this.endMark])) {
        this.endMark += 1;
    }

    this.drawNew();
    this.changed();
};

StringMorph.prototype.enableSelecting = function () {
    this.mouseDownLeft = function (pos) {
        var crs = this.root().cursor,
            already = crs ? crs.target === this : false;
        if (this.world().currentKey === 16) {
            this.shiftClick(pos);
        } else {
            this.clearSelection();
            if (this.isEditable && (!this.isDraggable)) {
                this.edit();
                this.root().cursor.gotoPos(pos);
                this.startMark = this.slotAt(pos);
                this.endMark = this.startMark;
                this.currentlySelecting = true;
                if (!already) {this.escalateEvent('mouseDownLeft', pos); }
            }
        }
    };
    this.mouseMove = function (pos) {
        if (this.isEditable &&
            this.currentlySelecting &&
            (!this.isDraggable)) {
            var newMark = this.slotAt(pos);
            if (newMark !== this.endMark) {
                this.endMark = newMark;
                this.drawNew();
                this.changed();
            }
        }
    };
};

StringMorph.prototype.disableSelecting = function () {
    this.mouseDownLeft = StringMorph.prototype.mouseDownLeft;
    delete this.mouseMove;
};

// TextMorph ////////////////////////////////////////////////////////////////

// I am a multi-line, word-wrapping String, quasi-inheriting from StringMorph

// TextMorph inherits from Morph:

TextMorph.prototype = new Morph();
TextMorph.prototype.constructor = TextMorph;
TextMorph.uber = Morph.prototype;

// TextMorph instance creation:

function TextMorph(
    text,
    fontSize,
    fontStyle,
    bold,
    italic,
    alignment,
    width,
    fontName,
    shadowOffset,
    shadowColor
) {
    this.init(text,
        fontSize,
        fontStyle,
        bold,
        italic,
        alignment,
        width,
        fontName,
        shadowOffset,
        shadowColor);
}

TextMorph.prototype.init = function (
    text,
    fontSize,
    fontStyle,
    bold,
    italic,
    alignment,
    width,
    fontName,
    shadowOffset,
    shadowColor
) {
    // additional properties:
    this.text = text || (text === '' ? text : 'TextMorph');
    this.words = [];
    this.lines = [];
    this.lineSlots = [];
    this.fontSize = fontSize || 12;
    this.fontName = fontName || MorphicPreferences.globalFontFamily;
    this.fontStyle = fontStyle || 'sans-serif';
    this.isBold = bold || false;
    this.isItalic = italic || false;
    this.alignment = alignment || 'left';
    this.shadowOffset = shadowOffset || new Point(0, 0);
    this.shadowColor = shadowColor || null;
    this.maxWidth = width || 0;
    this.maxLineWidth = 0;
    this.backgroundColor = null;
    this.isEditable = false;

    //additional properties for ad-hoc evaluation:
    this.receiver = null;

    // additional properties for text-editing:
    this.isScrollable = true; // scrolls into view when edited
    this.currentlySelecting = false;
    this.startMark = 0;
    this.endMark = 0;
    this.markedTextColor = new Color(255, 255, 255);
    this.markedBackgoundColor = new Color(60, 60, 120);

    // initialize inherited properties:
    TextMorph.uber.init.call(this);

    // override inherited properites:
    this.color = new Color(0, 0, 0);
    this.noticesTransparentClick = true;
    this.drawNew();
};

TextMorph.prototype.toString = function () {
    // e.g. 'a TextMorph("Hello World")'
    return 'a TextMorph' + '("' + this.text.slice(0, 30) + '...")';
};

TextMorph.prototype.font = StringMorph.prototype.font;

TextMorph.prototype.parse = function () {
    var myself = this,
        paragraphs = this.text.split('\n'),
        canvas = newCanvas(),
        context = canvas.getContext('2d'),
        oldline = '',
        newline,
        w,
        slot = 0;

    context.font = this.font();
    this.maxLineWidth = 0;
    this.lines = [];
    this.lineSlots = [0];
    this.words = [];

    paragraphs.forEach(function (p) {
        myself.words = myself.words.concat(p.split(' '));
        myself.words.push('\n');
    });

    this.words.forEach(function (word) {
        if (word === '\n') {
            myself.lines.push(oldline);
            myself.lineSlots.push(slot);
            myself.maxLineWidth = Math.max(
                myself.maxLineWidth,
                context.measureText(oldline).width
            );
            oldline = '';
        } else {
            if (myself.maxWidth > 0) {
                newline = oldline + word + ' ';
                w = context.measureText(newline).width;
                if (w > myself.maxWidth) {
                    myself.lines.push(oldline);
                    myself.lineSlots.push(slot);
                    myself.maxLineWidth = Math.max(
                        myself.maxLineWidth,
                        context.measureText(oldline).width
                    );
                    oldline = word + ' ';
                } else {
                    oldline = newline;
                }
            } else {
                oldline = oldline + word + ' ';
            }
            slot += word.length + 1;
        }
    });
};

TextMorph.prototype.drawNew = function () {
    var context, height, i, line, width, shadowHeight, shadowWidth,
        offx, offy, x, y, start, stop, p, c;

    this.image = newCanvas();
    context = this.image.getContext('2d');
    context.font = this.font();
    this.parse();

    // set my extent
    shadowWidth = Math.abs(this.shadowOffset.x);
    shadowHeight = Math.abs(this.shadowOffset.y);
    height = this.lines.length * (fontHeight(this.fontSize) + shadowHeight);
    if (this.maxWidth === 0) {
        this.bounds = this.bounds.origin.extent(
            new Point(this.maxLineWidth + shadowWidth, height)
        );
    } else {
        this.bounds = this.bounds.origin.extent(
            new Point(this.maxWidth + shadowWidth, height)
        );
    }
    this.image.width = this.width();
    this.image.height = this.height();

    // prepare context for drawing text
    context = this.image.getContext('2d');
    context.font = this.font();
    context.textAlign = 'left';
    context.textBaseline = 'bottom';

    // fill the background, if desired
    if (this.backgroundColor) {
        context.fillStyle = this.backgroundColor.toString();
        context.fillRect(0, 0, this.width(), this.height());
    }

    // draw the shadow, if any
    if (this.shadowColor) {
        offx = Math.max(this.shadowOffset.x, 0);
        offy = Math.max(this.shadowOffset.y, 0);
        context.fillStyle = this.shadowColor.toString();

        for (i = 0; i < this.lines.length; i = i + 1) {
            line = this.lines[i];
            width = context.measureText(line).width + shadowWidth;
            if (this.alignment === 'right') {
                x = this.width() - width;
            } else if (this.alignment === 'center') {
                x = (this.width() - width) / 2;
            } else { // 'left'
                x = 0;
            }
            y = (i + 1) * (fontHeight(this.fontSize) + shadowHeight)
                - shadowHeight;
            context.fillText(line, x + offx, y + offy);
        }
    }

    // now draw the actual text
    offx = Math.abs(Math.min(this.shadowOffset.x, 0));
    offy = Math.abs(Math.min(this.shadowOffset.y, 0));
    context.fillStyle = this.color.toString();

    for (i = 0; i < this.lines.length; i = i + 1) {
        line = this.lines[i];
        width = context.measureText(line).width + shadowWidth;
        if (this.alignment === 'right') {
            x = this.width() - width;
        } else if (this.alignment === 'center') {
            x = (this.width() - width) / 2;
        } else { // 'left'
            x = 0;
        }
        y = (i + 1) * (fontHeight(this.fontSize) + shadowHeight)
            - shadowHeight;
        context.fillText(line, x + offx, y + offy);
    }

    // draw the selection
    start = Math.min(this.startMark, this.endMark);
    stop = Math.max(this.startMark, this.endMark);
    for (i = start; i < stop; i += 1) {
        p = this.slotPosition(i).subtract(this.position());
        c = this.text.charAt(i);
        context.fillStyle = this.markedBackgoundColor.toString();
        context.fillRect(p.x, p.y, context.measureText(c).width + 1,
            fontHeight(this.fontSize));
        context.fillStyle = this.markedTextColor.toString();
        context.fillText(c, p.x, p.y + fontHeight(this.fontSize));
    }

    // notify my parent of layout change
    if (this.parent) {
        if (this.parent.layoutChanged) {
            this.parent.layoutChanged();
        }
    }
};

TextMorph.prototype.setExtent = function (aPoint) {
    this.maxWidth = Math.max(aPoint.x, 0);
    this.changed();
    this.drawNew();
};

// TextMorph mesuring:

TextMorph.prototype.columnRow = function (slot) {
    // answer the logical position point of the given index ("slot")
    var row,
        col,
        idx = 0;

    for (row = 0; row < this.lines.length; row += 1) {
        idx = this.lineSlots[row];
        for (col = 0; col < this.lines[row].length; col += 1) {
            if (idx === slot) {
                return new Point(col, row);
            }
            idx += 1;
        }
    }
    // return new Point(0, 0);
    return new Point(
        this.lines[this.lines.length - 1].length - 1,
        this.lines.length - 1
    );
};

TextMorph.prototype.slotPosition = function (slot) {
    // answer the physical position point of the given index ("slot")
    // where the cursor should be placed
    var colRow = this.columnRow(slot),
        context = this.image.getContext('2d'),
        shadowHeight = Math.abs(this.shadowOffset.y),
        xOffset = 0,
        yOffset,
        x,
        y,
        idx;

    yOffset = colRow.y * (fontHeight(this.fontSize) + shadowHeight);
    for (idx = 0; idx < colRow.x; idx += 1) {
        xOffset += context.measureText(this.lines[colRow.y][idx]).width;
    }
    x = this.left() + xOffset;
    y = this.top() + yOffset;
    return new Point(x, y);
};

TextMorph.prototype.slotAt = function (aPoint) {
    // answer the slot (index) closest to the given point taking
    // in account how far from the middle of the character it is,
    // so the cursor can be moved accordingly

    var charX = 0,
        row = 0,
        col = 0,
        shadowHeight = Math.abs(this.shadowOffset.y),
        context = this.image.getContext('2d');

    while (aPoint.y - this.top() >
    ((fontHeight(this.fontSize) + shadowHeight) * row)) {
        row += 1;
    }
    row = Math.max(row, 1);

    while (aPoint.x - this.left() > charX) {
        charX += context.measureText(this.lines[row - 1][col]).width;
        col += 1;
    }

    // see where our click fell with respect to the middle of the char
    if (aPoint.x - this.left() >
        charX - context.measureText(this.lines[row - 1][col]).width / 2) {
        return this.lineSlots[Math.max(row - 1, 0)] + col;
    } else {
        return this.lineSlots[Math.max(row - 1, 0)] + col - 1;
    }
};

TextMorph.prototype.upFrom = function (slot) {
    // answer the slot above the given one
    var above,
        colRow = this.columnRow(slot);
    if (colRow.y < 1) {
        return slot;
    }
    above = this.lines[colRow.y - 1];
    if (above.length < colRow.x - 1) {
        return this.lineSlots[colRow.y - 1] + above.length;
    }
    return this.lineSlots[colRow.y - 1] + colRow.x;
};

TextMorph.prototype.downFrom = function (slot) {
    // answer the slot below the given one
    var below,
        colRow = this.columnRow(slot);
    if (colRow.y > this.lines.length - 2) {
        return slot;
    }
    below = this.lines[colRow.y + 1];
    if (below.length < colRow.x - 1) {
        return this.lineSlots[colRow.y + 1] + below.length;
    }
    return this.lineSlots[colRow.y + 1] + colRow.x;
};

TextMorph.prototype.startOfLine = function (slot) {
    // answer the first slot (index) of the line for the given slot
    return this.lineSlots[this.columnRow(slot).y];
};

TextMorph.prototype.endOfLine = function (slot) {
    // answer the slot (index) indicating the EOL for the given slot
    return this.startOfLine(slot) +
        this.lines[this.columnRow(slot).y].length - 1;
};

TextMorph.prototype.previousWordFrom = StringMorph.prototype.previousWordFrom;

TextMorph.prototype.nextWordFrom = StringMorph.prototype.nextWordFrom;

// TextMorph editing:

TextMorph.prototype.edit = StringMorph.prototype.edit;

TextMorph.prototype.selection = StringMorph.prototype.selection;

TextMorph.prototype.selectionStartSlot
    = StringMorph.prototype.selectionStartSlot;

TextMorph.prototype.clearSelection = StringMorph.prototype.clearSelection;

TextMorph.prototype.deleteSelection = StringMorph.prototype.deleteSelection;

TextMorph.prototype.selectAll = StringMorph.prototype.selectAll;

TextMorph.prototype.mouseDownLeft = StringMorph.prototype.mouseDownLeft;

TextMorph.prototype.shiftClick = StringMorph.prototype.shiftClick;

TextMorph.prototype.mouseClickLeft = StringMorph.prototype.mouseClickLeft;

TextMorph.prototype.mouseDoubleClick = StringMorph.prototype.mouseDoubleClick;

TextMorph.prototype.selectWordAt = StringMorph.prototype.selectWordAt;

TextMorph.prototype.selectBetweenWordsAt
    = StringMorph.prototype.selectBetweenWordsAt;

TextMorph.prototype.enableSelecting = StringMorph.prototype.enableSelecting;

TextMorph.prototype.disableSelecting = StringMorph.prototype.disableSelecting;

TextMorph.prototype.selectAllAndEdit = function () {
    this.edit();
    this.selectAll();
};

// TextMorph menus:

TextMorph.prototype.developersMenu = function () {
    var menu = TextMorph.uber.developersMenu.call(this);
    menu.addLine();
    menu.addItem("edit", 'edit');
    menu.addItem(
        "font size...",
        function () {
            this.prompt(
                menu.title + '\nfont\nsize:',
                this.setFontSize,
                this,
                this.fontSize.toString(),
                null,
                6,
                100,
                true
            );
        },
        'set this Text\'s\nfont point size'
    );
    if (this.alignment !== 'left') {
        menu.addItem("align left", 'setAlignmentToLeft');
    }
    if (this.alignment !== 'right') {
        menu.addItem("align right", 'setAlignmentToRight');
    }
    if (this.alignment !== 'center') {
        menu.addItem("align center", 'setAlignmentToCenter');
    }
    menu.addLine();
    if (this.fontStyle !== 'serif') {
        menu.addItem("serif", 'setSerif');
    }
    if (this.fontStyle !== 'sans-serif') {
        menu.addItem("sans-serif", 'setSansSerif');
    }
    if (this.isBold) {
        menu.addItem("normal weight", 'toggleWeight');
    } else {
        menu.addItem("bold", 'toggleWeight');
    }
    if (this.isItalic) {
        menu.addItem("normal style", 'toggleItalic');
    } else {
        menu.addItem("italic", 'toggleItalic');
    }
    return menu;
};

TextMorph.prototype.setAlignmentToLeft = function () {
    this.alignment = 'left';
    this.drawNew();
    this.changed();
};

TextMorph.prototype.setAlignmentToRight = function () {
    this.alignment = 'right';
    this.drawNew();
    this.changed();
};

TextMorph.prototype.setAlignmentToCenter = function () {
    this.alignment = 'center';
    this.drawNew();
    this.changed();
};

TextMorph.prototype.toggleIsDraggable
    = StringMorph.prototype.toggleIsDraggable;

TextMorph.prototype.toggleWeight = StringMorph.prototype.toggleWeight;

TextMorph.prototype.toggleItalic = StringMorph.prototype.toggleItalic;

TextMorph.prototype.setSerif = StringMorph.prototype.setSerif;

TextMorph.prototype.setSansSerif = StringMorph.prototype.setSansSerif;

TextMorph.prototype.setText = StringMorph.prototype.setText;

TextMorph.prototype.setFontSize = StringMorph.prototype.setFontSize;

TextMorph.prototype.numericalSetters = StringMorph.prototype.numericalSetters;

// TextMorph evaluation:

TextMorph.prototype.evaluationMenu = function () {
    var menu = new MenuMorph(this, null);
    menu.addItem(
        "do it",
        'doIt',
        'evaluate the\nselected expression'
    );
    menu.addItem(
        "show it",
        'showIt',
        'evaluate the\nselected expression\nand show the result'
    );
    menu.addItem(
        "inspect it",
        'inspectIt',
        'evaluate the\nselected expression\nand inspect the result'
    );
    menu.addLine();
    menu.addItem("select all", 'selectAllAndEdit');
    return menu;
};

TextMorph.prototype.setReceiver = function (obj) {
    this.receiver = obj;
    this.customContextMenu = this.evaluationMenu();
};

TextMorph.prototype.doIt = function () {
    this.receiver.evaluateString(this.selection());
    this.edit();
};

TextMorph.prototype.showIt = function () {
    var result = this.receiver.evaluateString(this.selection());
    if (result !== null) {
        this.inform(result);
    }
};

TextMorph.prototype.inspectIt = function () {
    var result = this.receiver.evaluateString(this.selection()),
        world = this.world(),
        inspector;
    if (isObject(result)) {
        inspector = new InspectorMorph(result);
        inspector.setPosition(world.hand.position());
        inspector.keepWithin(world);
        world.add(inspector);
        inspector.changed();
    }
};

// TriggerMorph ////////////////////////////////////////////////////////

// I provide basic button functionality

// TriggerMorph inherits from Morph:

TriggerMorph.prototype = new Morph();
TriggerMorph.prototype.constructor = TriggerMorph;
TriggerMorph.uber = Morph.prototype;

// TriggerMorph instance creation:

function TriggerMorph(
    target,
    action,
    labelString,
    fontSize,
    fontStyle,
    environment,
    hint,
    labelColor,
    labelBold,
    labelItalic,
    doubleClickAction
) {
    this.init(
        target,
        action,
        labelString,
        fontSize,
        fontStyle,
        environment,
        hint,
        labelColor,
        labelBold,
        labelItalic,
        doubleClickAction
    );
}

TriggerMorph.prototype.init = function (
    target,
    action,
    labelString,
    fontSize,
    fontStyle,
    environment,
    hint,
    labelColor,
    labelBold,
    labelItalic,
    doubleClickAction
) {
    // additional properties:
    this.target = target || null;
    this.action = action || null;
    this.doubleClickAction = doubleClickAction || null;
    this.environment = environment || null;
    this.labelString = labelString || null;
    this.label = null;
    this.hint = hint || null; // null, String, or Function
    this.schedule = null; // animation slot for displaying hints
    this.fontSize = fontSize || MorphicPreferences.menuFontSize;
    this.fontStyle = fontStyle || 'sans-serif';
    this.highlightColor = new Color(192, 192, 192);
    this.pressColor = new Color(128, 128, 128);
    this.labelColor = labelColor || new Color(0, 0, 0);
    this.labelBold = labelBold || false;
    this.labelItalic = labelItalic || false;

    // initialize inherited properties:
    TriggerMorph.uber.init.call(this);

    // override inherited properites:
    this.color = new Color(255, 255, 255);
    this.drawNew();
};

// TriggerMorph drawing:

TriggerMorph.prototype.drawNew = function () {
    this.createBackgrounds();
    if (this.labelString !== null) {
        this.createLabel();
    }
};

TriggerMorph.prototype.createBackgrounds = function () {
    var context,
        ext = this.extent();

    this.normalImage = newCanvas(ext);
    context = this.normalImage.getContext('2d');
    context.fillStyle = this.color.toString();
    context.fillRect(0, 0, ext.x, ext.y);

    this.highlightImage = newCanvas(ext);
    context = this.highlightImage.getContext('2d');
    context.fillStyle = this.highlightColor.toString();
    context.fillRect(0, 0, ext.x, ext.y);

    this.pressImage = newCanvas(ext);
    context = this.pressImage.getContext('2d');
    context.fillStyle = this.pressColor.toString();
    context.fillRect(0, 0, ext.x, ext.y);

    this.image = this.normalImage;
};

TriggerMorph.prototype.createLabel = function () {
    if (this.label !== null) {
        this.label.destroy();
    }
    this.label = new StringMorph(
        this.labelString,
        this.fontSize,
        this.fontStyle,
        this.labelBold,
        this.labelItalic,
        false, // numeric
        null, // shadow offset
        null, // shadow color
        this.labelColor
    );
    this.label.setPosition(
        this.center().subtract(
            this.label.extent().floorDivideBy(2)
        )
    );
    this.add(this.label);
};

// TriggerMorph action:

TriggerMorph.prototype.trigger = function () {
    /*
    if target is a function, use it as callback:
    execute target as callback function with action as argument
    in the environment as optionally specified.
    Note: if action is also a function, instead of becoming
    the argument itself it will be called to answer the argument.
    for selections, Yes/No Choices etc. As second argument pass
    myself, so I can be modified to reflect status changes, e.g.
    inside a list box:

    else (if target is not a function):

        if action is a function:
        execute the action with target as environment (can be null)
        for lambdafied (inline) actions

        else if action is a String:
        treat it as function property of target and execute it
        for selector-like actions
    */
    if (this.schedule) {
        this.schedule.isActive = false;
    }
    if (typeof this.target === 'function') {
        if (typeof this.action === 'function') {
            this.target.call(this.environment, this.action.call(), this);
        } else {
            this.target.call(this.environment, this.action, this);
        }
    } else {
        if (typeof this.action === 'function') {
            this.action.call(this.target);
        } else { // assume it's a String
            this.target[this.action]();
        }
    }
};

TriggerMorph.prototype.triggerDoubleClick = function () {
    // same as trigger() but use doubleClickAction instead of action property
    // note that specifying a doubleClickAction is optional
    if (!this.doubleClickAction) {return; }
    if (this.schedule) {
        this.schedule.isActive = false;
    }
    if (typeof this.target === 'function') {
        if (typeof this.doubleClickAction === 'function') {
            this.target.call(
                this.environment,
                this.doubleClickAction.call(),
                this
            );
        } else {
            this.target.call(this.environment, this.doubleClickAction, this);
        }
    } else {
        if (typeof this.doubleClickAction === 'function') {
            this.doubleClickAction.call(this.target);
        } else { // assume it's a String
            this.target[this.doubleClickAction]();
        }
    }
};

// TriggerMorph events:

TriggerMorph.prototype.mouseEnter = function () {
    var contents = this.hint instanceof Function ? this.hint() : this.hint;
    this.image = this.highlightImage;
    this.changed();
    if (contents) {
        this.bubbleHelp(contents);
    }
};

TriggerMorph.prototype.mouseLeave = function () {
    this.image = this.normalImage;
    this.changed();
    if (this.schedule) {
        this.schedule.isActive = false;
    }
    if (this.hint) {
        this.world().hand.destroyTemporaries();
    }
};

TriggerMorph.prototype.mouseDownLeft = function () {
    this.image = this.pressImage;
    this.changed();
};

TriggerMorph.prototype.mouseClickLeft = function () {
    this.image = this.highlightImage;
    this.changed();
    this.trigger();
};

TriggerMorph.prototype.mouseDoubleClick = function () {
    this.triggerDoubleClick();
};

TriggerMorph.prototype.rootForGrab = function () {
    return this.isDraggable ? TriggerMorph.uber.rootForGrab.call(this) : null;
};

// TriggerMorph bubble help:

TriggerMorph.prototype.bubbleHelp = function (contents) {
    var world = this.world(),
        myself = this;
    this.schedule = new Animation(
        nop,
        nop,
        0,
        500,
        nop,
        function () {myself.popUpbubbleHelp(contents); }
    );
    world.animations.push(this.schedule);
};

TriggerMorph.prototype.popUpbubbleHelp = function (contents) {
    new SpeechBubbleMorph(
        localize(contents),
        null,
        null,
        1
    ).popUp(this.world(), this.rightCenter().add(new Point(-8, 0)));
};

// MenuItemMorph ///////////////////////////////////////////////////////

// I automatically determine my bounds

var MenuItemMorph;

// MenuItemMorph inherits from TriggerMorph:

MenuItemMorph.prototype = new TriggerMorph();
MenuItemMorph.prototype.constructor = MenuItemMorph;
MenuItemMorph.uber = TriggerMorph.prototype;

// MenuItemMorph instance creation:

function MenuItemMorph(
    target,
    action,
    labelString, // can also be a Morph or a Canvas or a tuple: [icon, string]
    fontSize,
    fontStyle,
    environment,
    hint,
    color,
    bold,
    italic,
    doubleClickAction, // optional when used as list morph.jsk item
    shortcut // optional string, Morph, Canvas or tuple: [icon, string]
) {
    // additional properties:
    this.shortcutString = shortcut || null;
    this.shortcut = null;

    // initialize inherited properties:
    this.init(
        target,
        action,
        labelString,
        fontSize,
        fontStyle,
        environment,
        hint,
        color,
        bold,
        italic,
        doubleClickAction
    );
}

MenuItemMorph.prototype.createLabel = function () {
    var w, h;
    if (this.label) {
        this.label.destroy();
    }
    this.label = this.createLabelPart(this.labelString);
    this.add(this.label);
    w = this.label.width();
    h = this.label.height();
    if (this.shortcut) {
        this.shortcut.destroy();
    }
    if (this.shortcutString) {
        this.shortcut = this.createLabelPart(this.shortcutString);
        w += this.shortcut.width() + 4;
        h = Math.max(h, this.shortcut.height());
        this.add(this.shortcut);
    }
    this.silentSetExtent(new Point(w + 8, h));
    this.fixLayout();
};

MenuItemMorph.prototype.fixLayout = function () {
    var cntr = this.center();
    this.label.setCenter(cntr);
    this.label.setLeft(this.left() + 4);
    if (this.shortcut) {
        this.shortcut.setCenter(cntr);
        this.shortcut.setRight(this.right() - 4);
    }
};

MenuItemMorph.prototype.createLabelPart = function (source) {
    var part, icon, lbl;
    if (isString(source)) {
        return this.createLabelString(source);
    }
    if (source instanceof Array) {
        // assume its pattern is: [icon, string]
        part = new Morph();
        part.alpha = 0; // transparent
        icon = this.createIcon(source[0]);
        part.add(icon);
        lbl = this.createLabelString(source[1]);
        part.add(lbl);
        lbl.setCenter(icon.center());
        lbl.setLeft(icon.right() + 4);
        part.bounds = (icon.bounds.merge(lbl.bounds));
        part.drawNew();
        return part;
    }
    // assume it's either a Morph or a Canvas
    return this.createIcon(source);
};

MenuItemMorph.prototype.createIcon = function (source) {
    // source can be either a Morph or an HTMLCanvasElement
    var icon = new Morph(),
        src;
    icon.image = source instanceof Morph ? source.fullImage() : source;
    // adjust shadow dimensions
    if (source instanceof Morph && source.getShadow()) {
        src = icon.image;
        icon.image = newCanvas(
            source.fullBounds().extent().subtract(
                this.shadowBlur * (useBlurredShadows ? 1 : 2)
            )
        );
        icon.image.getContext('2d').drawImage(src, 0, 0);
    }
    icon.silentSetWidth(icon.image.width);
    icon.silentSetHeight(icon.image.height);
    return icon;
};

MenuItemMorph.prototype.createLabelString = function (string) {
    var lbl = new TextMorph(
        string,
        this.fontSize,
        this.fontStyle,
        this.labelBold,
        this.labelItalic
    );
    lbl.setColor(this.labelColor);
    return lbl;
};

// MenuItemMorph events:

MenuItemMorph.prototype.mouseEnter = function () {
    var menu = this.parentThatIsA(MenuMorph);
    if (this.isShowingSubmenu()) {
        return;
    }
    if (menu) {
        menu.closeSubmenu();
    }
    if (!this.isListItem()) {
        this.image = this.highlightImage;
        this.changed();
    }
    if (this.action instanceof MenuMorph) {
        this.delaySubmenu();
    } else if (this.hint) {
        this.bubbleHelp(this.hint);
    }
};

MenuItemMorph.prototype.mouseLeave = function () {
    if (!this.isListItem()) {
        if (this.isShowingSubmenu()) {
            this.image = this.highlightImage;
        } else {
            this.image = this.normalImage;
        }
        this.changed();
    }
    if (this.schedule) {
        this.schedule.isActive = false;
    }
    if (this.hint) {
        this.world().hand.destroyTemporaries();
    }
};

MenuItemMorph.prototype.mouseDownLeft = function (pos) {
    if (this.isListItem()) {
        this.parentThatIsA(MenuMorph).unselectAllItems();
        this.escalateEvent('mouseDownLeft', pos);
    }
    this.image = this.pressImage;
    this.changed();
};

MenuItemMorph.prototype.mouseMove = function () {
    if (this.isListItem()) {
        this.escalateEvent('mouseMove');
    }
};

MenuItemMorph.prototype.mouseClickLeft = function () {
    if (this.action instanceof MenuMorph) {
        this.popUpSubmenu();
    } else {
        if (!this.isListItem()) {
            this.parentThatIsA(MenuMorph).closeRootMenu();
            this.world().activeMenu = null;
        }
        this.trigger();
    }
};

MenuItemMorph.prototype.isListItem = function () {
    var menu = this.parentThatIsA(MenuMorph);
    if (menu) {
        return menu.isListContents;
    }
    return false;
};

MenuItemMorph.prototype.isSelectedListItem = function () {
    if (this.isListItem()) {
        return this.image === this.pressImage;
    }
    return false;
};

MenuItemMorph.prototype.isShowingSubmenu = function () {
    var menu = this.parentThatIsA(MenuMorph);
    if (menu && (this.action instanceof MenuMorph)) {
        return menu.submenu === this.action;
    }
    return false;
};

// MenuItemMorph submenus:

MenuItemMorph.prototype.delaySubmenu = function () {
    var world = this.world(),
        myself = this;
    this.schedule = new Animation(
        nop,
        nop,
        0,
        500,
        nop,
        function () {myself.popUpSubmenu(); }
    );
    world.animations.push(this.schedule);
};

MenuItemMorph.prototype.popUpSubmenu = function () {
    var menu = this.parentThatIsA(MenuMorph);
    if (!(this.action instanceof MenuMorph)) {return; }
    this.action.drawNew();
    this.action.setPosition(this.topRight().subtract(new Point(0, 5)));
    this.action.addShadow(new Point(2, 2), 80);
    this.action.keepWithin(this.world());
    if (this.action.items.length < 1 && !this.action.title) {return; }
    menu.add(this.action);
    menu.submenu = this.action;
    menu.submenu.world = menu.world; // keyboard control
    this.action.fullChanged();
};

// FrameMorph //////////////////////////////////////////////////////////

// I clip my submorphs at my bounds

// Frames inherit from Morph:

FrameMorph.prototype = new Morph();
FrameMorph.prototype.constructor = FrameMorph;
FrameMorph.uber = Morph.prototype;

function FrameMorph(aScrollFrame) {
    this.init(aScrollFrame);
}

FrameMorph.prototype.init = function (aScrollFrame) {
    this.scrollFrame = aScrollFrame || null;

    FrameMorph.uber.init.call(this);
    this.color = new Color(255, 250, 245);
    this.drawNew();
    this.acceptsDrops = true;

    if (this.scrollFrame) {
        this.isDraggable = false;
        this.noticesTransparentClick = false;
        this.alpha = 0;
    }
};

FrameMorph.prototype.fullBounds = function () {
    var shadow = this.getShadow();
    if (shadow !== null) {
        return this.bounds.merge(shadow.bounds);
    }
    return this.bounds;
};

FrameMorph.prototype.fullImage = function () {
    // use only for shadows
    return this.image;
};

FrameMorph.prototype.fullDrawOn = function (aCanvas, aRect) {
    var rectangle, dirty;
    if (!this.isVisible) {
        return null;
    }
    rectangle = aRect || this.fullBounds();
    dirty = this.bounds.intersect(rectangle);
    if (!dirty.extent().gt(new Point(0, 0))) {
        return null;
    }
    this.drawOn(aCanvas, dirty);
    this.children.forEach(function (child) {
        if (child instanceof ShadowMorph) {
            child.fullDrawOn(aCanvas, rectangle);
        } else {
            child.fullDrawOn(aCanvas, dirty);
        }
    });
};

// FrameMorph navigation:

FrameMorph.prototype.topMorphAt = function (point) {
    var i, result;
    if (!(this.isVisible && this.bounds.containsPoint(point))) {
        return null;
    }
    for (i = this.children.length - 1; i >= 0; i -= 1) {
        result = this.children[i].topMorphAt(point);
        if (result) {return result; }
    }
    return this.noticesTransparentClick ||
    !this.isTransparentAt(point) ? this : null;
};

// FrameMorph scrolling support:

FrameMorph.prototype.submorphBounds = function () {
    var result = null;

    if (this.children.length > 0) {
        result = this.children[0].bounds;
        this.children.forEach(function (child) {
            result = result.merge(child.fullBounds());
        });
    }
    return result;
};

FrameMorph.prototype.keepInScrollFrame = function () {
    if (this.scrollFrame === null) {
        return null;
    }
    if (this.left() > this.scrollFrame.left()) {
        this.moveBy(
            new Point(this.scrollFrame.left() - this.left(), 0)
        );
    }
    if (this.right() < this.scrollFrame.right()) {
        this.moveBy(
            new Point(this.scrollFrame.right() - this.right(), 0)
        );
    }
    if (this.top() > this.scrollFrame.top()) {
        this.moveBy(
            new Point(0, this.scrollFrame.top() - this.top())
        );
    }
    if (this.bottom() < this.scrollFrame.bottom()) {
        this.moveBy(
            0,
            new Point(this.scrollFrame.bottom() - this.bottom(), 0)
        );
    }
};

FrameMorph.prototype.adjustBounds = function () {
    var subBounds,
        newBounds,
        myself = this;

    if (this.scrollFrame === null) {
        return null;
    }

    subBounds = this.submorphBounds();
    if (subBounds && (!this.scrollFrame.isTextLineWrapping)) {
        newBounds = subBounds
            .expandBy(this.scrollFrame.padding)
            .growBy(this.scrollFrame.growth)
            .merge(this.scrollFrame.bounds);
    } else {
        newBounds = this.scrollFrame.bounds.copy();
    }
    if (!this.bounds.eq(newBounds)) {
        this.bounds = newBounds;
        this.drawNew();
        this.keepInScrollFrame();
    }

    if (this.scrollFrame.isTextLineWrapping) {
        this.children.forEach(function (morph) {
            if (morph instanceof TextMorph) {
                morph.setWidth(myself.width());
                myself.setHeight(
                    Math.max(morph.height(), myself.scrollFrame.height())
                );
            }
        });
    }

    this.scrollFrame.adjustScrollBars();
};

// FrameMorph dragging & dropping of contents:

FrameMorph.prototype.reactToDropOf = function () {
    this.adjustBounds();
};

FrameMorph.prototype.reactToGrabOf = function () {
    this.adjustBounds();
};

// FrameMorph menus:

FrameMorph.prototype.developersMenu = function () {
    var menu = FrameMorph.uber.developersMenu.call(this);
    if (this.children.length > 0) {
        menu.addLine();
        menu.addItem(
            "move all inside...",
            'keepAllSubmorphsWithin',
            'keep all submorphs\nwithin and visible'
        );
    }
    return menu;
};

FrameMorph.prototype.keepAllSubmorphsWithin = function () {
    var myself = this;
    this.children.forEach(function (m) {
        m.keepWithin(myself);
    });
};

// ScrollFrameMorph ////////////////////////////////////////////////////

ScrollFrameMorph.prototype = new FrameMorph();
ScrollFrameMorph.prototype.constructor = ScrollFrameMorph;
ScrollFrameMorph.uber = FrameMorph.prototype;

function ScrollFrameMorph(scroller, size, sliderColor) {
    this.init(scroller, size, sliderColor);
}

ScrollFrameMorph.prototype.init = function (scroller, size, sliderColor) {
    var myself = this;

    ScrollFrameMorph.uber.init.call(this);
    this.scrollBarSize = size || MorphicPreferences.scrollBarSize;
    this.autoScrollTrigger = null;
    this.enableAutoScrolling = true; // change to suppress
    this.isScrollingByDragging = true; // change to suppress
    this.hasVelocity = true; // dto.
    this.padding = 0; // around the scrollable area
    this.growth = 0; // pixels or Point to grow right/left when near edge
    this.isTextLineWrapping = false;
    this.contents = scroller || new FrameMorph(this);
    this.add(this.contents);
    this.hBar = new SliderMorph(
        null, // start
        null, // stop
        null, // value
        null, // size
        'horizontal',
        sliderColor
    );
    this.hBar.setHeight(this.scrollBarSize);
    this.hBar.action = function (num) {
        myself.contents.setPosition(
            new Point(
                myself.left() - num,
                myself.contents.position().y
            )
        );
    };
    this.hBar.isDraggable = false;
    this.add(this.hBar);
    this.vBar = new SliderMorph(
        null, // start
        null, // stop
        null, // value
        null, // size
        'vertical',
        sliderColor
    );
    this.vBar.setWidth(this.scrollBarSize);
    this.vBar.action = function (num) {
        myself.contents.setPosition(
            new Point(
                myself.contents.position().x,
                myself.top() - num
            )
        );
    };
    this.vBar.isDraggable = false;
    this.add(this.vBar);
    this.toolBar = null; // optional slot
};

ScrollFrameMorph.prototype.adjustScrollBars = function () {
    var hWidth = this.width() - this.scrollBarSize,
        vHeight = this.height() - this.scrollBarSize;

    this.changed();
    if (this.contents.width() > this.width() +
        MorphicPreferences.scrollBarSize) {
        this.hBar.show();
        if (this.hBar.width() !== hWidth) {
            this.hBar.setWidth(hWidth);
        }

        this.hBar.setPosition(
            new Point(
                this.left(),
                this.bottom() - this.hBar.height()
            )
        );
        this.hBar.start = 0;
        this.hBar.stop = this.contents.width() - this.width();
        this.hBar.size =
            this.width() / this.contents.width() * this.hBar.stop;
        this.hBar.value = this.left() - this.contents.left();
        this.hBar.drawNew();
    } else {
        this.hBar.hide();
    }

    if (this.contents.height() > this.height() +
        this.scrollBarSize) {
        this.vBar.show();
        if (this.vBar.height() !== vHeight) {
            this.vBar.setHeight(vHeight);
        }

        this.vBar.setPosition(
            new Point(
                this.right() - this.vBar.width(),
                this.top()
            )
        );
        this.vBar.start = 0;
        this.vBar.stop = this.contents.height() - this.height();
        this.vBar.size =
            this.height() / this.contents.height() * this.vBar.stop;
        this.vBar.value = this.top() - this.contents.top();
        this.vBar.drawNew();
    } else {
        this.vBar.hide();
    }
    this.adjustToolBar();
};

ScrollFrameMorph.prototype.adjustToolBar = function () {
    var padding = 3;
    if (this.toolBar) {
        this.toolBar.setTop(this.top() + padding);
        this.toolBar.setRight(
            (this.vBar.isVisible ? this.vBar.left() : this.right()) - padding
        );
    }
};

ScrollFrameMorph.prototype.addContents = function (aMorph) {
    this.contents.add(aMorph);
    this.contents.adjustBounds();
};

ScrollFrameMorph.prototype.setContents = function (aMorph) {
    this.contents.children.forEach(function (m) {
        m.destroy();
    });
    this.contents.children = [];
    aMorph.setPosition(this.position().add(this.padding + 2));
    this.addContents(aMorph);
};

ScrollFrameMorph.prototype.setExtent = function (aPoint) {
    if (this.isTextLineWrapping) {
        this.contents.setPosition(this.position().copy());
    }
    ScrollFrameMorph.uber.setExtent.call(this, aPoint);
    this.contents.adjustBounds();
};

// ScrollFrameMorph scrolling by dragging:

ScrollFrameMorph.prototype.scrollX = function (steps) {
    var cl = this.contents.left(),
        l = this.left(),
        cw = this.contents.width(),
        r = this.right(),
        newX;

    newX = cl + steps;
    if (newX + cw < r) {
        newX = r - cw;
    }
    if (newX > l) {
        newX = l;
    }
    if (newX !== cl) {
        this.contents.setLeft(newX);
    }
};

ScrollFrameMorph.prototype.scrollY = function (steps) {
    var ct = this.contents.top(),
        t = this.top(),
        ch = this.contents.height(),
        b = this.bottom(),
        newY;

    newY = ct + steps;
    if (newY + ch < b) {
        newY = b - ch;
    }
    if (newY > t) {
        newY = t;
    }
    if (newY !== ct) {
        this.contents.setTop(newY);
    }
};

ScrollFrameMorph.prototype.step = nop;

ScrollFrameMorph.prototype.mouseDownLeft = function (pos) {
    if (!this.isScrollingByDragging) {
        return null;
    }
    var world = this.root(),
        hand = world.hand,
        oldPos = pos,
        myself = this,
        deltaX = 0,
        deltaY = 0,
        friction = 0.8;

    this.step = function () {
        var newPos;
        if (hand.mouseButton &&
            (hand.children.length === 0) &&
            (myself.bounds.containsPoint(hand.bounds.origin))) {

            if (hand.grabPosition &&
                (hand.grabPosition.distanceTo(hand.position()) <=
                    MorphicPreferences.grabThreshold)) {
                // still within the grab threshold
                return null;
            }

            newPos = hand.bounds.origin;
            deltaX = newPos.x - oldPos.x;
            if (deltaX !== 0) {
                myself.scrollX(deltaX);
            }
            deltaY = newPos.y - oldPos.y;
            if (deltaY !== 0) {
                myself.scrollY(deltaY);
            }
            oldPos = newPos;
        } else {
            if (!myself.hasVelocity) {
                myself.step = function () {
                    nop();
                };
            } else {
                if ((Math.abs(deltaX) < 0.5) &&
                    (Math.abs(deltaY) < 0.5)) {
                    myself.step = function () {
                        nop();
                    };
                } else {
                    deltaX = deltaX * friction;
                    myself.scrollX(Math.round(deltaX));
                    deltaY = deltaY * friction;
                    myself.scrollY(Math.round(deltaY));
                }
            }
        }
        this.adjustScrollBars();
    };
};

ScrollFrameMorph.prototype.startAutoScrolling = function () {
    var myself = this,
        inset = MorphicPreferences.scrollBarSize * 3,
        world = this.world(),
        hand,
        inner,
        pos;

    if (!world) {
        return null;
    }
    hand = world.hand;
    if (!this.autoScrollTrigger) {
        this.autoScrollTrigger = Date.now();
    }
    this.step = function () {
        pos = hand.bounds.origin;
        inner = myself.bounds.insetBy(inset);
        if ((myself.bounds.containsPoint(pos)) &&
            (!(inner.containsPoint(pos))) &&
            (hand.children.length > 0)) {
            myself.autoScroll(pos);
        } else {
            myself.step = function () {
                nop();
            };
            myself.autoScrollTrigger = null;
        }
    };
};

ScrollFrameMorph.prototype.autoScroll = function (pos) {
    var inset, area;

    if (Date.now() - this.autoScrollTrigger < 500) {
        return null;
    }

    inset = MorphicPreferences.scrollBarSize * 3;
    area = this.topLeft().extent(new Point(this.width(), inset));
    if (area.containsPoint(pos)) {
        this.scrollY(inset - (pos.y - this.top()));
    }
    area = this.topLeft().extent(new Point(inset, this.height()));
    if (area.containsPoint(pos)) {
        this.scrollX(inset - (pos.x - this.left()));
    }
    area = (new Point(this.right() - inset, this.top()))
        .extent(new Point(inset, this.height()));
    if (area.containsPoint(pos)) {
        this.scrollX(-(inset - (this.right() - pos.x)));
    }
    area = (new Point(this.left(), this.bottom() - inset))
        .extent(new Point(this.width(), inset));
    if (area.containsPoint(pos)) {
        this.scrollY(-(inset - (this.bottom() - pos.y)));
    }
    this.adjustScrollBars();
};

// ScrollFrameMorph scrolling by editing text:

ScrollFrameMorph.prototype.scrollCursorIntoView = function (morph) {
    var txt = morph.target,
        offset = txt.position().subtract(this.contents.position()),
        ft = this.top() + this.padding,
        fb = this.bottom() - this.padding;
    this.contents.setExtent(txt.extent().add(offset).add(this.padding));
    if (morph.top() < ft) {
        this.contents.setTop(this.contents.top() + ft - morph.top());
        morph.setTop(ft);
    } else if (morph.bottom() > fb) {
        this.contents.setBottom(this.contents.bottom() + fb - morph.bottom());
        morph.setBottom(fb);
    }
    this.adjustScrollBars();
};

// ScrollFrameMorph events:

ScrollFrameMorph.prototype.mouseScroll = function (y, x) {
    if (y) {
        this.scrollY(y * MorphicPreferences.mouseScrollAmount);
    }
    if (x) {
        this.scrollX(x * MorphicPreferences.mouseScrollAmount);
    }
    this.adjustScrollBars();
};

// ScrollFrameMorph duplicating:

ScrollFrameMorph.prototype.updateReferences = function (map) {
    var myself = this;
    ScrollFrameMorph.uber.updateReferences.call(this, map);
    if (this.hBar) {
        this.hBar.action = function (num) {
            myself.contents.setPosition(
                new Point(myself.left() - num, myself.contents.position().y)
            );
        };
    }
    if (this.vBar) {
        this.vBar.action = function (num) {
            myself.contents.setPosition(
                new Point(myself.contents.position().x, myself.top() - num)
            );
        };
    }
};

// ScrollFrameMorph menu:

ScrollFrameMorph.prototype.developersMenu = function () {
    var menu = ScrollFrameMorph.uber.developersMenu.call(this);
    if (this.isTextLineWrapping) {
        menu.addItem(
            "auto line wrap off...",
            'toggleTextLineWrapping',
            'turn automatic\nline wrapping\noff'
        );
    } else {
        menu.addItem(
            "auto line wrap on...",
            'toggleTextLineWrapping',
            'enable automatic\nline wrapping'
        );
    }
    return menu;
};

ScrollFrameMorph.prototype.toggleTextLineWrapping = function () {
    this.isTextLineWrapping = !this.isTextLineWrapping;
};

// ListMorph ///////////////////////////////////////////////////////////

ListMorph.prototype = new ScrollFrameMorph();
ListMorph.prototype.constructor = ListMorph;
ListMorph.uber = ScrollFrameMorph.prototype;

function ListMorph(elements, labelGetter, format, doubleClickAction) {
    /*
        passing a format is optional. If the format parameter is specified
        it has to be of the following pattern:

            [
                [<color>, <single-argument predicate>],
                ['bold', <single-argument predicate>],
                ['italic', <single-argument predicate>],
                ...
            ]

        multiple conditions can be passed in such a format list, the
        last predicate to evaluate true when given the list element sets
        the given format category (color, bold, italic).
        If no condition is met, the default format (color black, non-bold,
        non-italic) will be assigned.

        An example of how to use fomats can be found in the InspectorMorph's
        "markOwnProperties" mechanism.
    */
    this.init(
        elements || [],
        labelGetter || function (element) {
            if (isString(element)) {
                return element;
            }
            if (element.toSource) {
                return element.toSource();
            }
            return element.toString();
        },
        format || [],
        doubleClickAction // optional callback
    );
}

ListMorph.prototype.init = function (
    elements,
    labelGetter,
    format,
    doubleClickAction
) {
    ListMorph.uber.init.call(this);

    this.contents.acceptsDrops = false;
    this.color = new Color(255, 255, 255);
    this.hBar.alpha = 0.6;
    this.vBar.alpha = 0.6;
    this.elements = elements || [];
    this.labelGetter = labelGetter;
    this.format = format;
    this.listContents = null;
    this.selected = null; // actual element currently selected
    this.active = null; // menu item representing the selected element
    this.action = null;
    this.doubleClickAction = doubleClickAction || null;
    this.acceptsDrops = false;
    this.buildListContents();
};

ListMorph.prototype.buildListContents = function () {
    var myself = this;
    if (this.listContents) {
        this.listContents.destroy();
    }
    this.listContents = new MenuMorph(
        this.select,
        null,
        this
    );
    if (this.elements.length === 0) {
        this.elements = ['(empty)'];
    }
    this.elements.forEach(function (element) {
        var color = null,
            bold = false,
            italic = false;

        myself.format.forEach(function (pair) {
            if (pair[1].call(null, element)) {
                if (pair[0] === 'bold') {
                    bold = true;
                } else if (pair[0] === 'italic') {
                    italic = true;
                } else { // assume it's a color
                    color = pair[0];
                }
            }
        });
        myself.listContents.addItem(
            myself.labelGetter(element), // label string
            element, // action
            null, // hint
            color,
            bold,
            italic,
            myself.doubleClickAction
        );
    });
    this.listContents.isListContents = true;
    this.listContents.drawNew();
    this.listContents.setPosition(this.contents.position());
    this.addContents(this.listContents);
};

ListMorph.prototype.select = function (item, trigger) {
    if (isNil(item)) {return; }
    this.selected = item;
    this.active = trigger;
    if (this.action) {
        this.action.call(null, item);
    }
};

ListMorph.prototype.setExtent = function (aPoint) {
    var lb = this.listContents.bounds,
        nb = this.bounds.origin.copy().corner(
            this.bounds.origin.add(aPoint)
        );

    if (nb.right() > lb.right() && nb.width() <= lb.width()) {
        this.listContents.setRight(nb.right());
    }
    if (nb.bottom() > lb.bottom() && nb.height() <= lb.height()) {
        this.listContents.setBottom(nb.bottom());
    }
    ListMorph.uber.setExtent.call(this, aPoint);
};

ListMorph.prototype.activeIndex = function () {
    return this.listContents.children.indexOf(this.active);
};

ListMorph.prototype.activateIndex = function (idx) {
    var item = this.listContents.children[idx];
    if (!item) {return; }
    item.image = item.pressImage;
    item.changed();
    item.trigger();
};

// StringFieldMorph ////////////////////////////////////////////////////

// StringFieldMorph inherit from FrameMorph:

StringFieldMorph.prototype = new FrameMorph();
StringFieldMorph.prototype.constructor = StringFieldMorph;
StringFieldMorph.uber = FrameMorph.prototype;

function StringFieldMorph(
    defaultContents,
    minWidth,
    fontSize,
    fontStyle,
    bold,
    italic,
    isNumeric
) {
    this.init(
        defaultContents || '',
        minWidth || 100,
        fontSize || 12,
        fontStyle || 'sans-serif',
        bold || false,
        italic || false,
        isNumeric
    );
}

StringFieldMorph.prototype.init = function (
    defaultContents,
    minWidth,
    fontSize,
    fontStyle,
    bold,
    italic,
    isNumeric
) {
    this.defaultContents = defaultContents;
    this.minWidth = minWidth;
    this.fontSize = fontSize;
    this.fontStyle = fontStyle;
    this.isBold = bold;
    this.isItalic = italic;
    this.isNumeric = isNumeric || false;
    this.text = null;
    StringFieldMorph.uber.init.call(this);
    this.color = new Color(255, 255, 255);
    this.isEditable = true;
    this.acceptsDrops = false;
    this.drawNew();
};

StringFieldMorph.prototype.drawNew = function () {
    var txt;
    txt = this.text ? this.string() : this.defaultContents;
    this.text = null;
    this.children.forEach(function (child) {
        child.destroy();
    });
    this.children = [];
    this.text = new StringMorph(
        txt,
        this.fontSize,
        this.fontStyle,
        this.isBold,
        this.isItalic,
        this.isNumeric
    );

    this.text.isNumeric = this.isNumeric; // for whichever reason...
    this.text.setPosition(this.bounds.origin.copy());
    this.text.isEditable = this.isEditable;
    this.text.isDraggable = false;
    this.text.enableSelecting();
    this.silentSetExtent(
        new Point(
            Math.max(this.width(), this.minWidth),
            this.text.height()
        )
    );
    StringFieldMorph.uber.drawNew.call(this);
    this.add(this.text);
};

StringFieldMorph.prototype.string = function () {
    return this.text.text;
};

StringFieldMorph.prototype.mouseClickLeft = function (pos) {
    if (this.isEditable) {
        this.text.edit();
    } else {
        this.escalateEvent('mouseClickLeft', pos);
    }
};

// BouncerMorph ////////////////////////////////////////////////////////

// I am a Demo of a stepping custom Morph

var BouncerMorph;

// Bouncers inherit from Morph:

BouncerMorph.prototype = new Morph();
BouncerMorph.prototype.constructor = BouncerMorph;
BouncerMorph.uber = Morph.prototype;

// BouncerMorph instance creation:

function BouncerMorph() {
    this.init();
}

// BouncerMorph initialization:

BouncerMorph.prototype.init = function (type, speed) {
    BouncerMorph.uber.init.call(this);
    this.fps = 50;

    // additional properties:
    this.isStopped = false;
    this.type = type || 'vertical';
    if (this.type === 'vertical') {
        this.direction = 'down';
    } else {
        this.direction = 'right';
    }
    this.speed = speed || 1;
};

// BouncerMorph moving:

BouncerMorph.prototype.moveUp = function () {
    this.moveBy(new Point(0, -this.speed));
};

BouncerMorph.prototype.moveDown = function () {
    this.moveBy(new Point(0, this.speed));
};

BouncerMorph.prototype.moveRight = function () {
    this.moveBy(new Point(this.speed, 0));
};

BouncerMorph.prototype.moveLeft = function () {
    this.moveBy(new Point(-this.speed, 0));
};

// BouncerMorph stepping:

BouncerMorph.prototype.step = function () {
    if (!this.isStopped) {
        if (this.type === 'vertical') {
            if (this.direction === 'down') {
                this.moveDown();
            } else {
                this.moveUp();
            }
            if (this.fullBounds().top() < this.parent.top() &&
                this.direction === 'up') {
                this.direction = 'down';
            }
            if (this.fullBounds().bottom() > this.parent.bottom() &&
                this.direction === 'down') {
                this.direction = 'up';
            }
        } else if (this.type === 'horizontal') {
            if (this.direction === 'right') {
                this.moveRight();
            } else {
                this.moveLeft();
            }
            if (this.fullBounds().left() < this.parent.left() &&
                this.direction === 'left') {
                this.direction = 'right';
            }
            if (this.fullBounds().right() > this.parent.right() &&
                this.direction === 'right') {
                this.direction = 'left';
            }
        }
    }
};

// HandMorph ///////////////////////////////////////////////////////////

// I represent the Mouse cursor

// HandMorph inherits from Morph:

HandMorph.prototype = new Morph();
HandMorph.prototype.constructor = HandMorph;
HandMorph.uber = Morph.prototype;

// HandMorph instance creation:

function HandMorph(aWorld) {
    this.init(aWorld);
}

// HandMorph initialization:

HandMorph.prototype.init = function (aWorld) {
    HandMorph.uber.init.call(this, true);
    this.bounds = new Rectangle();

    // additional properties:
    this.world = aWorld;
    this.mouseButton = null;
    this.mouseOverList = [];
    this.morphToGrab = null;
    this.grabPosition = null;
    this.grabOrigin = null;
    this.temporaries = [];
    this.touchHoldTimeout = null;
    this.contextMenuEnabled = false;
};

HandMorph.prototype.changed = function () {
    var b;
    if (this.world !== null) {
        b = this.fullBounds();
        if (!b.extent().eq(new Point())) {
            this.world.broken.push(b.spread());
        }
    }
};

HandMorph.prototype.fullChanged = HandMorph.prototype.changed;

// HandMorph navigation:

HandMorph.prototype.morphAtPointer = function () {
    return this.world.topMorphAt(this.bounds.origin) || this.world;
};

HandMorph.prototype.allMorphsAtPointer = function () {
    var morphs = this.world.allChildren(),
        myself = this;
    return morphs.filter(function (m) {
        return m.isVisible &&
            m.visibleBounds().containsPoint(myself.bounds.origin);
    });
};

// HandMorph dragging and dropping:
/*
    drag 'n' drop events, method(arg) -> receiver:

        prepareToBeGrabbed(handMorph) -> grabTarget
        reactToGrabOf(grabbedMorph) -> oldParent
        wantsDropOf(morphToDrop) ->  newParent
        justDropped(handMorph) -> droppedMorph
        reactToDropOf(droppedMorph, handMorph) -> newParent
*/

HandMorph.prototype.dropTargetFor = function (aMorph) {
    var target = this.morphAtPointer();
    while (!target.wantsDropOf(aMorph)) {
        target = target.parent;
    }
    return target;
};

HandMorph.prototype.grab = function (aMorph) {
    var oldParent = aMorph.parent;
    if (aMorph instanceof WorldMorph) {
        return null;
    }
    if (this.children.length === 0) {
        this.world.stopEditing();
        this.grabOrigin = aMorph.situation();
        if (!(aMorph instanceof MenuMorph)) {
            aMorph.addShadow();
        }
        if (aMorph.prepareToBeGrabbed) {
            aMorph.prepareToBeGrabbed(this);
        }
        aMorph.cachedFullImage = aMorph.fullImageClassic();
        aMorph.cachedFullBounds = aMorph.fullBounds();
        this.add(aMorph);
        this.changed();
        if (oldParent && oldParent.reactToGrabOf) {
            oldParent.reactToGrabOf(aMorph);
        }
    }
};

HandMorph.prototype.drop = function () {
    var target, morphToDrop;
    if (this.children.length !== 0) {
        morphToDrop = this.children[0];
        target = this.dropTargetFor(morphToDrop);
        target = target.selectForEdit ? target.selectForEdit() : target;
        this.changed();
        target.add(morphToDrop);
        morphToDrop.cachedFullImage = null;
        morphToDrop.cachedFullBounds = null;
        morphToDrop.changed();
        if (!(morphToDrop instanceof MenuMorph)) {
            morphToDrop.removeShadow();
        }
        this.children = [];
        this.setExtent(new Point());
        if (morphToDrop.justDropped) {
            morphToDrop.justDropped(this);
        }
        if (target.reactToDropOf) {
            target.reactToDropOf(morphToDrop, this);
        }
    }
};

// HandMorph event dispatching:
/*
    mouse events:

        mouseDownLeft
        mouseDownRight
        mouseClickLeft
        mouseClickRight
        mouseDoubleClick
        mouseEnter
        mouseLeave
        mouseEnterDragging
        mouseLeaveDragging
        mouseMove
        mouseScroll
*/

HandMorph.prototype.processMouseDown = function (event) {
    var morph, actualClick;

    this.destroyTemporaries();
    this.contextMenuEnabled = true;
    this.morphToGrab = null;
    this.grabPosition = null;
    if (this.children.length !== 0) {
        this.drop();
        this.mouseButton = null;
    } else {
        morph = this.morphAtPointer();
        if (this.world.activeMenu) {
            if (!contains(
                morph.allParents(),
                this.world.activeMenu
            )) {
                this.world.activeMenu.destroy();
            } else {
                clearInterval(this.touchHoldTimeout);
            }
        }
        if (this.world.activeHandle) {
            if (morph !== this.world.activeHandle) {
                this.world.activeHandle.destroy();
            }
        }
        if (this.world.cursor) {
            if (morph !== this.world.cursor.target) {
                this.world.stopEditing();
            }
        }
        if (!morph.mouseMove) {
            this.morphToGrab = morph.rootForGrab();
            this.grabPosition = this.bounds.origin.copy();
        }
        if (event.button === 2 || event.ctrlKey) {
            this.mouseButton = 'right';
            actualClick = 'mouseDownRight';
        } else {
            this.mouseButton = 'left';
            actualClick = 'mouseDownLeft';
        }
        while (!morph[actualClick]) {
            morph = morph.parent;
        }
        morph[actualClick](this.bounds.origin);
    }
};

HandMorph.prototype.processTouchStart = function (event) {
    var myself = this;
    MorphicPreferences.isTouchDevice = true;
    clearInterval(this.touchHoldTimeout);
    if (event.touches.length === 1) {
        this.touchHoldTimeout = setInterval( // simulate mouseRightClick
            function () {
                myself.processMouseDown({button: 2});
                myself.processMouseUp({button: 2});
                event.preventDefault();
                clearInterval(myself.touchHoldTimeout);
            },
            400
        );
        this.processMouseMove(event.touches[0]); // update my position
        this.processMouseDown({button: 0});
        event.preventDefault();
    }
};

HandMorph.prototype.processTouchMove = function (event) {
    MorphicPreferences.isTouchDevice = true;
    if (event.touches.length === 1) {
        var touch = event.touches[0];
        this.processMouseMove(touch);
        clearInterval(this.touchHoldTimeout);
    }
};

HandMorph.prototype.processTouchEnd = function (event) {
    MorphicPreferences.isTouchDevice = true;
    clearInterval(this.touchHoldTimeout);
    nop(event);
    this.processMouseUp({button: 0});
};

HandMorph.prototype.processMouseUp = function () {
    var morph = this.morphAtPointer(),
        context,
        contextMenu,
        expectedClick;

    this.destroyTemporaries();
    if (this.children.length !== 0) {
        this.drop();
    } else {
        if (this.mouseButton === 'left') {
            expectedClick = 'mouseClickLeft';
        } else {
            expectedClick = 'mouseClickRight';
            if (this.mouseButton && this.contextMenuEnabled) {
                context = morph;
                contextMenu = context.contextMenu();
                while ((!contextMenu) &&
                context.parent) {
                    context = context.parent;
                    contextMenu = context.contextMenu();
                }
                if (contextMenu) {
                    contextMenu.popUpAtHand(this.world);
                }
            }
        }
        while (!morph[expectedClick]) {
            morph = morph.parent;
        }
        morph[expectedClick](this.bounds.origin);
    }
    this.mouseButton = null;
};

HandMorph.prototype.processDoubleClick = function () {
    var morph = this.morphAtPointer();

    this.destroyTemporaries();
    if (this.children.length !== 0) {
        this.drop();
    } else {
        while (morph && !morph.mouseDoubleClick) {
            morph = morph.parent;
        }
        if (morph) {
            morph.mouseDoubleClick(this.bounds.origin);
        }
    }
    this.mouseButton = null;
};

HandMorph.prototype.processMouseMove = function (event) {
    var pos,
        posInDocument = getDocumentPositionOf(this.world.worldCanvas),
        mouseOverNew,
        myself = this,
        morph,
        topMorph;

    pos = new Point(
        event.pageX - posInDocument.x,
        event.pageY - posInDocument.y
    );

    this.setPosition(pos);

    // determine the new mouse-over-list:
    // mouseOverNew = this.allMorphsAtPointer();
    mouseOverNew = this.morphAtPointer().allParents();

    if (!this.children.length && this.mouseButton) {
        topMorph = this.morphAtPointer();
        morph = topMorph.rootForGrab();
        if (topMorph.mouseMove) {
            topMorph.mouseMove(pos, this.mouseButton);
            if (this.mouseButton === 'right') {
                this.contextMenuEnabled = false;
            }
        }

        // if a morph.jsk is marked for grabbing, just grab it
        if (this.mouseButton === 'left' &&
            this.morphToGrab &&
            (this.grabPosition.distanceTo(this.bounds.origin) >
                MorphicPreferences.grabThreshold)) {
            this.setPosition(this.grabPosition);
            if (this.morphToGrab.isDraggable) {
                morph = this.morphToGrab.selectForEdit ?
                    this.morphToGrab.selectForEdit() : this.morphToGrab;
                this.grab(morph);
            } else if (this.morphToGrab.isTemplate) {
                this.world.stopEditing();
                morph = this.morphToGrab.fullCopy();
                morph.isTemplate = false;
                morph.isDraggable = true;
                if (morph.reactToTemplateCopy) {
                    morph.reactToTemplateCopy();
                }
                this.grab(morph);
                this.grabOrigin = this.morphToGrab.situation();
            }
            this.setPosition(pos);
        }
    }

    this.mouseOverList.forEach(function (old) {
        if (!contains(mouseOverNew, old)) {
            if (old.mouseLeave) {
                old.mouseLeave();
            }
            if (old.mouseLeaveDragging && myself.mouseButton) {
                old.mouseLeaveDragging();
            }
        }
    });
    mouseOverNew.forEach(function (newMorph) {
        if (!contains(myself.mouseOverList, newMorph)) {
            if (newMorph.mouseEnter) {
                newMorph.mouseEnter();
            }
            if (newMorph.mouseEnterDragging && myself.mouseButton) {
                newMorph.mouseEnterDragging();
            }
        }

        // autoScrolling support:
        if (myself.children.length > 0) {
            if (newMorph instanceof ScrollFrameMorph &&
                newMorph.enableAutoScrolling &&
                newMorph.contents.allChildren().some(function (any) {
                    return any.wantsDropOf(myself.children[0]);
                })
            ) {
                if (!newMorph.bounds.insetBy(
                    MorphicPreferences.scrollBarSize * 3
                ).containsPoint(myself.bounds.origin)) {
                    newMorph.startAutoScrolling();
                }
            }
        }
    });
    this.mouseOverList = mouseOverNew;
};

HandMorph.prototype.processMouseScroll = function (event) {
    var morph = this.morphAtPointer();
    while (morph && !morph.mouseScroll) {
        morph = morph.parent;
    }
    if (morph) {
        morph.mouseScroll(
            (event.detail / -3) || (
                Object.prototype.hasOwnProperty.call(
                    event,
                    'wheelDeltaY'
                ) ?
                    event.wheelDeltaY / 120 :
                    event.wheelDelta / 120
            ),
            event.wheelDeltaX / 120 || 0
        );
    }
};

/*
    drop event:

        droppedImage
        droppedSVG
        droppedAudio
        droppedText
*/

HandMorph.prototype.processDrop = function (event) {
    /*
        find out whether an external image or audio file was dropped
        onto the world canvas, turn it into an offscreen canvas or audio
        element and dispatch the

            droppedImage(canvas, name)
            droppedSVG(image, name)
            droppedAudio(audio, name)

        events to interested Morphs at the mouse pointer
    */
    var files = event instanceof FileList ? event
        : event.target.files || event.dataTransfer.files,
        file,
        url = event.dataTransfer ?
            event.dataTransfer.getData('URL') : null,
        txt = event.dataTransfer ?
            event.dataTransfer.getData('Text/HTML') : null,
        suffix,
        src,
        target = this.morphAtPointer(),
        img = new Image(),
        canvas,
        i;

    function readSVG(aFile) {
        var pic = new Image(),
            frd = new FileReader();
        while (!target.droppedSVG) {
            target = target.parent;
        }
        pic.onload = function () {
            target.droppedSVG(pic, aFile.name);
        };
        frd = new FileReader();
        frd.onloadend = function (e) {
            pic.src = e.target.result;
        };
        frd.readAsDataURL(aFile);
    }

    function readImage(aFile) {
        var pic = new Image(),
            frd = new FileReader();
        while (!target.droppedImage) {
            target = target.parent;
        }
        pic.onload = function () {
            canvas = newCanvas(new Point(pic.width, pic.height), true);
            canvas.getContext('2d').drawImage(pic, 0, 0);
            target.droppedImage(canvas, aFile.name);
        };
        frd = new FileReader();
        frd.onloadend = function (e) {
            pic.src = e.target.result;
        };
        frd.readAsDataURL(aFile);
    }

    function readAudio(aFile) {
        var snd = new Audio(),
            frd = new FileReader();
        while (!target.droppedAudio) {
            target = target.parent;
        }
        frd.onloadend = function (e) {
            snd.src = e.target.result;
            target.droppedAudio(snd, aFile.name);
        };
        frd.readAsDataURL(aFile);
    }

    function readText(aFile) {
        var frd = new FileReader();
        while (!target.droppedText) {
            target = target.parent;
        }
        frd.onloadend = function (e) {
            target.droppedText(e.target.result, aFile.name);
        };
        frd.readAsText(aFile);
    }

    function readBinary(aFile) {
        var frd = new FileReader();
        while (!target.droppedBinary) {
            target = target.parent;
        }
        frd.onloadend = function (e) {
            target.droppedBinary(e.target.result, aFile.name);
        };
        frd.readAsArrayBuffer(aFile);
    }

    function readURL(url, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', url);
        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                if (request.responseText) {
                    callback(request.responseText);
                } else {
                    throw new Error('unable to retrieve ' + url);
                }
            }
        };
        request.send();
    }

    function parseImgURL(html) {
        var iurl = '',
            idx,
            c,
            start = html.indexOf('<img src="');
        if (start === -1) {return null; }
        start += 10;
        for (idx = start; idx < html.length; idx += 1) {
            c = html[idx];
            if (c === '"') {
                return iurl;
            }
            iurl = iurl.concat(c);
        }
        return null;
    }

    if (files.length > 0) {
        for (i = 0; i < files.length; i += 1) {
            file = files[i];
            if (file.type.indexOf("svg") !== -1
                && !MorphicPreferences.rasterizeSVGs) {
                readSVG(file);
            } else if (file.type.indexOf("image") === 0) {
                readImage(file);
            } else if (file.type.indexOf("audio") === 0) {
                readAudio(file);
            } else if (file.type.indexOf("text") === 0) {
                readText(file);
            } else { // assume it's meant to be binary
                readBinary(file);
            }
        }
    } else if (url) {
        suffix = url.slice(url.lastIndexOf('.') + 1).toLowerCase();
        if (
            contains(
                ['gif', 'png', 'jpg', 'jpeg', 'bmp'],
                suffix
            )
        ) {
            while (!target.droppedImage) {
                target = target.parent;
            }
            img = new Image();
            img.onload = function () {
                canvas = newCanvas(new Point(img.width, img.height), true);
                canvas.getContext('2d').drawImage(img, 0, 0);
                target.droppedImage(canvas);
            };
            img.src = url;
        } else if (suffix === 'svg' && !MorphicPreferences.rasterizeSVGs) {
            while (!target.droppedSVG) {
                target = target.parent;
            }
            readURL(
                url,
                function (txt) {
                    var pic = new Image();
                    pic.onload = function () {
                        target.droppedSVG(
                            pic,
                            url.slice(
                                url.lastIndexOf('/') + 1,
                                url.lastIndexOf('.')
                            )
                        );
                    };
                    pic.src = 'data:image/svg+xml;utf8,' +
                        encodeURIComponent(txt);
                }
            );
        }
    } else if (txt) {
        while (!target.droppedImage) {
            target = target.parent;
        }
        img = new Image();
        img.onload = function () {
            canvas = newCanvas(new Point(img.width, img.height), true);
            canvas.getContext('2d').drawImage(img, 0, 0);
            target.droppedImage(canvas);
        };
        src = parseImgURL(txt);
        if (src) {img.src = src; }
    }
};

// HandMorph tools

HandMorph.prototype.destroyTemporaries = function () {
    /*
        temporaries are just an array of morphs which will be deleted upon
        the next mouse click, or whenever another temporary Morph decides
        that it needs to remove them. The primary purpose of temporaries is
        to display tools tips of speech bubble help.
    */
    var myself = this;
    this.temporaries.forEach(function (morph) {
        if (!(morph.isClickable
            && morph.bounds.containsPoint(myself.position()))) {
            morph.destroy();
            myself.temporaries.splice(myself.temporaries.indexOf(morph), 1);
        }
    });
};

// WorldMorph //////////////////////////////////////////////////////////

// I represent the <canvas> element

// WorldMorph inherits from FrameMorph:

WorldMorph.prototype = new FrameMorph();
WorldMorph.prototype.constructor = WorldMorph;
WorldMorph.uber = FrameMorph.prototype;

// WorldMorph instance creation:

function WorldMorph(aCanvas, fillPage) {
    this.init(aCanvas, fillPage);
}

// WorldMorph initialization:

WorldMorph.prototype.init = function (aCanvas, fillPage) {
    WorldMorph.uber.init.call(this);
    this.color = new Color(205, 205, 205); // (130, 130, 130)
    this.alpha = 1;
    this.bounds = new Rectangle(0, 0, aCanvas.width, aCanvas.height);
    this.drawNew();
    this.isVisible = true;
    this.isDraggable = false;
    this.currentKey = null; // currently pressed key code
    this.worldCanvas = aCanvas;
    this.noticesTransparentClick = true;

    // additional properties:
    this.stamp = Date.now(); // reference in multi-world setups
    while (this.stamp === Date.now()) {nop(); }
    this.stamp = Date.now();

    this.useFillPage = fillPage;
    if (this.useFillPage === undefined) {
        this.useFillPage = true;
    }
    this.isDevMode = false;
    this.broken = [];
    this.animations = [];
    this.hand = new HandMorph(this);
    this.keyboardReceiver = null;
    this.cursor = null;
    this.lastEditedText = null;
    this.activeMenu = null;
    this.activeHandle = null;
    this.virtualKeyboard = null;

    this.initEventListeners();
};

// World Morph display:

WorldMorph.prototype.brokenFor = function (aMorph) {
    // private
    var fb = aMorph.fullBounds();
    return this.broken.filter(function (rect) {
        return rect.intersects(fb);
    });
};

WorldMorph.prototype.fullDrawOn = function (aCanvas, aRect) {
    WorldMorph.uber.fullDrawOn.call(this, aCanvas, aRect);
    this.hand.fullDrawOn(aCanvas, aRect);
};

WorldMorph.prototype.updateBroken = function () {
    var myself = this;
    this.condenseDamages();
    this.broken.forEach(function (rect) {
        if (rect.extent().gt(new Point(0, 0))) {
            myself.fullDrawOn(myself.worldCanvas, rect);
        }
    });
    this.broken = [];
};

WorldMorph.prototype.stepAnimations = function () {
    this.animations.forEach(function (anim) {anim.step(); });
    this.animations = this.animations.filter(function (anim) {
        return anim.isActive;
    });
};

WorldMorph.prototype.condenseDamages = function () {
    // collapse clustered damaged rectangles into their unions,
    // thereby reducing the array of brokens to a manageable size

    function condense(src) {
        var trgt = [], hit;
        src.forEach(function (rect) {
            hit = detect(
                trgt,
                function (each) {return each.isNearTo(rect, 20); }
            );
            if (hit) {
                hit.mergeWith(rect);
            } else {
                trgt.push(rect);
            }
        });
        return trgt;
    }

    var again = true, size = this.broken.length;
    while (again) {
        this.broken = condense(this.broken);
        again = (this.broken.length < size);
        size = this.broken.length;
    }
};

WorldMorph.prototype.doOneCycle = function () {
    this.stepFrame();
    this.stepAnimations();
    this.updateBroken();
};

WorldMorph.prototype.fillPage = function () {
    var clientHeight = window.innerHeight,
        clientWidth = window.innerWidth,
        myself = this;

    this.worldCanvas.style.position = "absolute";
    this.worldCanvas.style.left = "0px";
    this.worldCanvas.style.right = "0px";
    this.worldCanvas.style.width = "100%";
    this.worldCanvas.style.height = "100%";

    if (document.documentElement.scrollTop) {
        // scrolled down b/c of viewport scaling
        clientHeight = document.documentElement.clientHeight;
    }
    if (document.documentElement.scrollLeft) {
        // scrolled left b/c of viewport scaling
        clientWidth = document.documentElement.clientWidth;
    }
    if (this.worldCanvas.width !== clientWidth) {
        this.worldCanvas.width = clientWidth;
        this.setWidth(clientWidth);
    }
    if (this.worldCanvas.height !== clientHeight) {
        this.worldCanvas.height = clientHeight;
        this.setHeight(clientHeight);
    }
    this.children.forEach(function (child) {
        if (child.reactToWorldResize) {
            child.reactToWorldResize(myself.bounds.copy());
        }
    });
};

// WorldMorph global pixel access:

WorldMorph.prototype.getGlobalPixelColor = function (point) {
    // answer the color at the given point.

    /*
        // original method, now deprecated as of 4/4/2017 because Chrome
        // "taints" the on-screen canvas as soon as its image data is
        // requested, significantly slowing down subsequent blittings

        var dta = this.worldCanvas.getContext('2d').getImageData(
            point.x,
            point.y,
            1,
            1
        ).data;
        return new Color(dta[0], dta[1], dta[2]);
    */

    var clr = this.hand.morphAtPointer().getPixelColor(this.hand.position());
    // IMPORTANT:
    // all callers of getGlobalPixelColor should make provisions for retina
    // display support, which gets null-pixels interlaced with non-null ones:
    // if (!clr.a) {/* ignore */ }
    return clr;
};

// WorldMorph events:

WorldMorph.prototype.initVirtualKeyboard = function () {
    var myself = this;

    if (this.virtualKeyboard) {
        document.body.removeChild(this.virtualKeyboard);
        this.virtualKeyboard = null;
    }
    if (!MorphicPreferences.isTouchDevice
        || !MorphicPreferences.useVirtualKeyboard) {
        return;
    }
    this.virtualKeyboard = document.createElement("input");
    this.virtualKeyboard.type = "text";
    this.virtualKeyboard.style.color = "transparent";
    this.virtualKeyboard.style.backgroundColor = "transparent";
    this.virtualKeyboard.style.border = "none";
    this.virtualKeyboard.style.outline = "none";
    this.virtualKeyboard.style.position = "absolute";
    this.virtualKeyboard.style.top = "0px";
    this.virtualKeyboard.style.left = "0px";
    this.virtualKeyboard.style.width = "0px";
    this.virtualKeyboard.style.height = "0px";
    this.virtualKeyboard.autocapitalize = "none"; // iOS specific
    document.body.appendChild(this.virtualKeyboard);

    this.virtualKeyboard.addEventListener(
        "keydown",
        function (event) {
            // remember the keyCode in the world's currentKey property
            myself.currentKey = event.keyCode;
            if (myself.keyboardReceiver) {
                myself.keyboardReceiver.processKeyDown(event);
            }
            // supress backspace override
            if (event.keyCode === 8) {
                event.preventDefault();
            }
            // supress tab override and make sure tab gets
            // received by all browsers
            if (event.keyCode === 9) {
                if (myself.keyboardReceiver) {
                    myself.keyboardReceiver.processKeyPress(event);
                }
                event.preventDefault();
            }
        },
        false
    );

    this.virtualKeyboard.addEventListener(
        "keyup",
        function (event) {
            // flush the world's currentKey property
            myself.currentKey = null;
            // dispatch to keyboard receiver
            if (myself.keyboardReceiver) {
                if (myself.keyboardReceiver.processKeyUp) {
                    myself.keyboardReceiver.processKeyUp(event);
                }
            }
            event.preventDefault();
        },
        false
    );

    this.virtualKeyboard.addEventListener(
        "keypress",
        function (event) {
            if (myself.keyboardReceiver) {
                myself.keyboardReceiver.processKeyPress(event);
            }
            event.preventDefault();
        },
        false
    );
};

WorldMorph.prototype.initEventListeners = function () {
    var canvas = this.worldCanvas, myself = this;

    if (myself.useFillPage) {
        myself.fillPage();
    } else {
        this.changed();
    }

    canvas.addEventListener(
        "mousedown",
        function (event) {
            event.preventDefault();
            canvas.focus();
            myself.hand.processMouseDown(event);
        },
        false
    );

    canvas.addEventListener(
        "touchstart",
        function (event) {
            myself.hand.processTouchStart(event);
        },
        false
    );

    canvas.addEventListener(
        "mouseup",
        function (event) {
            event.preventDefault();
            myself.hand.processMouseUp(event);
        },
        false
    );

    canvas.addEventListener(
        "dblclick",
        function (event) {
            event.preventDefault();
            myself.hand.processDoubleClick(event);
        },
        false
    );

    canvas.addEventListener(
        "touchend",
        function (event) {
            myself.hand.processTouchEnd(event);
        },
        false
    );

    canvas.addEventListener(
        "mousemove",
        function (event) {
            myself.hand.processMouseMove(event);
        },
        false
    );

    canvas.addEventListener(
        "touchmove",
        function (event) {
            myself.hand.processTouchMove(event);
        },
        false
    );

    canvas.addEventListener(
        "contextmenu",
        function (event) {
            // suppress context menu for Mac-Firefox
            event.preventDefault();
        },
        false
    );

    canvas.addEventListener(
        "keydown",
        function (event) {
            // remember the keyCode in the world's currentKey property
            myself.currentKey = event.keyCode;
            if (myself.keyboardReceiver) {
                myself.keyboardReceiver.processKeyDown(event);
            }
            // supress backspace override
            if (event.keyCode === 8) {
                event.preventDefault();
            }
            // supress tab override and make sure tab gets
            // received by all browsers
            if (event.keyCode === 9) {
                if (myself.keyboardReceiver) {
                    myself.keyboardReceiver.processKeyPress(event);
                }
                event.preventDefault();
            }
            if ((event.ctrlKey && (!event.altKey) || event.metaKey) &&
                (event.keyCode !== 86)) { // allow pasting-in
                event.preventDefault();
            }
        },
        false
    );

    canvas.addEventListener(
        "keyup",
        function (event) {
            // flush the world's currentKey property
            myself.currentKey = null;
            // dispatch to keyboard receiver
            if (myself.keyboardReceiver) {
                if (myself.keyboardReceiver.processKeyUp) {
                    myself.keyboardReceiver.processKeyUp(event);
                }
            }
            event.preventDefault();
        },
        false
    );

    canvas.addEventListener(
        "keypress",
        function (event) {
            if (myself.keyboardReceiver) {
                myself.keyboardReceiver.processKeyPress(event);
            }
            event.preventDefault();
        },
        false
    );

    canvas.addEventListener( // Safari, Chrome
        "mousewheel",
        function (event) {
            myself.hand.processMouseScroll(event);
            event.preventDefault();
        },
        false
    );
    canvas.addEventListener( // Firefox
        "DOMMouseScroll",
        function (event) {
            myself.hand.processMouseScroll(event);
            event.preventDefault();
        },
        false
    );

    document.body.addEventListener(
        "paste",
        function (event) {
            var txt = event.clipboardData.getData("Text");
            if (txt && myself.cursor) {
                myself.cursor.insert(txt);
            }
        },
        false
    );

    window.addEventListener(
        "dragover",
        function (event) {
            event.preventDefault();
        },
        false
    );
    window.addEventListener(
        "drop",
        function (event) {
            myself.hand.processDrop(event);
            event.preventDefault();
        },
        false
    );

    window.addEventListener(
        "resize",
        function () {
            if (myself.useFillPage) {
                myself.fillPage();
            }
        },
        false
    );

    window.onbeforeunload = function (evt) {
        var e = evt || window.event,
            msg = "Are you sure you want to leave?";
        // For IE and Firefox
        if (e) {
            e.returnValue = msg;
        }
        // For Safari / chrome
        return msg;
    };
};

WorldMorph.prototype.mouseDownLeft = nop;

WorldMorph.prototype.mouseClickLeft = nop;

WorldMorph.prototype.mouseDownRight = nop;

WorldMorph.prototype.mouseClickRight = nop;

WorldMorph.prototype.wantsDropOf = function () {
    // allow handle drops if any drops are allowed
    return this.acceptsDrops;
};

WorldMorph.prototype.droppedImage = function () {
    return null;
};

WorldMorph.prototype.droppedSVG = function () {
    return null;
};

// WorldMorph text field tabbing:

WorldMorph.prototype.nextTab = function (editField) {
    var next = this.nextEntryField(editField);
    if (next) {
        editField.clearSelection();
        next.selectAll();
        next.edit();
    }
};

WorldMorph.prototype.previousTab = function (editField) {
    var prev = this.previousEntryField(editField);
    if (prev) {
        editField.clearSelection();
        prev.selectAll();
        prev.edit();
    }
};

// WorldMorph menu:

WorldMorph.prototype.contextMenu = function () {
    var menu;

    if (this.isDevMode) {
        menu = new MenuMorph(this, this.constructor.name ||
            this.constructor.toString().split(' ')[1].split('(')[0]);
    } else {
        menu = new MenuMorph(this, 'Morphic');
    }
    if (this.isDevMode) {
        menu.addItem("demo...", 'userCreateMorph', 'sample morphs');
        menu.addLine();
        menu.addItem("hide all...", 'hideAll');
        menu.addItem("show all...", 'showAllHiddens');
        menu.addItem(
            "move all inside...",
            'keepAllSubmorphsWithin',
            'keep all submorphs\nwithin and visible'
        );
        menu.addItem(
            "inspect...",
            'inspect',
            'open a window on\nall properties'
        );
        menu.addItem(
            "screenshot...",
            function () {
                window.open(this.fullImageClassic().toDataURL());
            },
            'open a new window\nwith a picture of this morph.jsk'
        );
        menu.addLine();
        menu.addItem(
            "restore display",
            'changed',
            'redraw the\nscreen once'
        );
        menu.addItem(
            "fill page...",
            'fillPage',
            'let the World automatically\nadjust to browser resizing'
        );
        if (useBlurredShadows) {
            menu.addItem(
                "sharp shadows...",
                'toggleBlurredShadows',
                'sharp drop shadows\nuse for old browsers'
            );
        } else {
            menu.addItem(
                "blurred shadows...",
                'toggleBlurredShadows',
                'blurry shades,\n use for new browsers'
            );
        }
        menu.addItem(
            "color...",
            function () {
                this.pickColor(
                    menu.title + localize('\ncolor:'),
                    this.setColor,
                    this,
                    this.color
                );
            },
            'choose the World\'s\nbackground color'
        );
        if (MorphicPreferences === standardSettings) {
            menu.addItem(
                "touch screen settings",
                'togglePreferences',
                'bigger menu fonts\nand sliders'
            );
        } else {
            menu.addItem(
                "standard settings",
                'togglePreferences',
                'smaller menu fonts\nand sliders'
            );
        }
        menu.addLine();
    }
    if (this.isDevMode) {
        menu.addItem(
            "user mode...",
            'toggleDevMode',
            'disable developers\'\ncontext menus'
        );
    } else {
        menu.addItem("development mode...", 'toggleDevMode');
    }
    menu.addItem("about morphic.js...", 'about');
    return menu;
};

WorldMorph.prototype.userCreateMorph = function () {
    var myself = this, menu, newMorph;

    function create(aMorph) {
        aMorph.isDraggable = true;
        aMorph.pickUp(myself);
    }

    menu = new MenuMorph(this, 'make a morph.jsk');
    menu.addItem('rectangle', function () {
        create(new Morph());
    });
    menu.addItem('box', function () {
        create(new BoxMorph());
    });
    menu.addItem('circle box', function () {
        create(new CircleBoxMorph());
    });
    menu.addLine();
    menu.addItem('slider', function () {
        create(new SliderMorph());
    });
    menu.addItem('dial', function () {
        newMorph = new DialMorph();
        newMorph.pickUp(this);
    });
    menu.addItem('frame', function () {
        newMorph = new FrameMorph();
        newMorph.setExtent(new Point(350, 250));
        create(newMorph);
    });
    menu.addItem('scroll frame', function () {
        newMorph = new ScrollFrameMorph();
        newMorph.contents.acceptsDrops = true;
        newMorph.contents.adjustBounds();
        newMorph.setExtent(new Point(350, 250));
        create(newMorph);
    });
    menu.addItem('handle', function () {
        create(new HandleMorph());
    });
    menu.addLine();
    menu.addItem('string', function () {
        newMorph = new StringMorph('Hello, World!');
        newMorph.isEditable = true;
        create(newMorph);
    });
    menu.addItem('text', function () {
        newMorph = new TextMorph(
            "Ich wei\u00DF nicht, was soll es bedeuten, dass ich so " +
            "traurig bin, ein M\u00E4rchen aus uralten Zeiten, das " +
            "kommt mir nicht aus dem Sinn. Die Luft ist k\u00FChl " +
            "und es dunkelt, und ruhig flie\u00DFt der Rhein; der " +
            "Gipfel des Berges funkelt im Abendsonnenschein. " +
            "Die sch\u00F6nste Jungfrau sitzet dort oben wunderbar, " +
            "ihr gold'nes Geschmeide blitzet, sie k\u00E4mmt ihr " +
            "goldenes Haar, sie k\u00E4mmt es mit goldenem Kamme, " +
            "und singt ein Lied dabei; das hat eine wundersame, " +
            "gewalt'ge Melodei. Den Schiffer im kleinen " +
            "Schiffe, ergreift es mit wildem Weh; er schaut " +
            "nicht die Felsenriffe, er schaut nur hinauf in " +
            "die H\u00F6h'. Ich glaube, die Wellen verschlingen " +
            "am Ende Schiffer und Kahn, und das hat mit ihrem " +
            "Singen, die Loreley getan."
        );
        newMorph.isEditable = true;
        newMorph.maxWidth = 300;
        newMorph.drawNew();
        create(newMorph);
    });
    menu.addItem('speech bubble', function () {
        newMorph = new SpeechBubbleMorph('Hello, World!');
        create(newMorph);
    });
    menu.addLine();
    menu.addItem('gray scale palette', function () {
        create(new GrayPaletteMorph());
    });
    menu.addItem('color palette', function () {
        create(new ColorPaletteMorph());
    });
    menu.addItem('color picker', function () {
        create(new ColorPickerMorph());
    });
    menu.addLine();
    menu.addItem('sensor demo', function () {
        newMorph = new MouseSensorMorph();
        newMorph.setColor(new Color(230, 200, 100));
        newMorph.edge = 35;
        newMorph.border = 15;
        newMorph.borderColor = new Color(200, 100, 50);
        newMorph.alpha = 0.2;
        newMorph.setExtent(new Point(100, 100));
        create(newMorph);
    });
    menu.addItem('animation demo', function () {
        var foo, bar, baz, garply, fred;

        foo = new BouncerMorph();
        foo.setPosition(new Point(50, 20));
        foo.setExtent(new Point(300, 200));
        foo.alpha = 0.9;
        foo.speed = 3;

        bar = new BouncerMorph();
        bar.setColor(new Color(50, 50, 50));
        bar.setPosition(new Point(80, 80));
        bar.setExtent(new Point(80, 250));
        bar.type = 'horizontal';
        bar.direction = 'right';
        bar.alpha = 0.9;
        bar.speed = 5;

        baz = new BouncerMorph();
        baz.setColor(new Color(20, 20, 20));
        baz.setPosition(new Point(90, 140));
        baz.setExtent(new Point(40, 30));
        baz.type = 'horizontal';
        baz.direction = 'right';
        baz.speed = 3;

        garply = new BouncerMorph();
        garply.setColor(new Color(200, 20, 20));
        garply.setPosition(new Point(90, 140));
        garply.setExtent(new Point(20, 20));
        garply.type = 'vertical';
        garply.direction = 'up';
        garply.speed = 8;

        fred = new BouncerMorph();
        fred.setColor(new Color(20, 200, 20));
        fred.setPosition(new Point(120, 140));
        fred.setExtent(new Point(20, 20));
        fred.type = 'vertical';
        fred.direction = 'down';
        fred.speed = 4;

        bar.add(garply);
        bar.add(baz);
        foo.add(fred);
        foo.add(bar);

        create(foo);
    });
    menu.addItem('pen', function () {
        create(new PenMorph());
    });
    if (myself.customMorphs) {
        menu.addLine();
        myself.customMorphs().forEach(function (morph) {
            menu.addItem(morph.toString(), function () {
                create(morph);
            });
        });
    }
    menu.popUpAtHand(this);
};

WorldMorph.prototype.toggleDevMode = function () {
    this.isDevMode = !this.isDevMode;
};

WorldMorph.prototype.hideAll = function () {
    this.children.forEach(function (child) {
        child.hide();
    });
};

WorldMorph.prototype.showAllHiddens = function () {
    this.forAllChildren(function (child) {
        if (!child.isVisible) {
            child.show();
        }
    });
};

WorldMorph.prototype.about = function () {
    var versions = '', module;

    for (module in modules) {
        if (Object.prototype.hasOwnProperty.call(modules, module)) {
            versions += ('\n' + module + ' (' + modules[module] + ')');
        }
    }
    if (versions !== '') {
        versions = '\n\nmodules:\n\n' +
            'morphic (' + morphicVersion + ')' +
            versions;
    }

    this.inform(
        'morphic.js\n\n' +
        'a lively Web GUI\ninspired by Squeak\n' +
        morphicVersion +
        '\n\nwritten by Jens M\u00F6nig\njens@moenig.org' +
        versions
    );
};

WorldMorph.prototype.edit = function (aStringOrTextMorph) {
    var pos = getDocumentPositionOf(this.worldCanvas);

    if (!aStringOrTextMorph.isEditable) {
        return null;
    }
    if (this.cursor) {
        this.cursor.destroy();
    }
    this.cursor = new CursorMorph(aStringOrTextMorph);
    aStringOrTextMorph.parent.add(this.cursor);
    this.keyboardReceiver = this.cursor;

    this.initVirtualKeyboard();
    if (MorphicPreferences.isTouchDevice
        && MorphicPreferences.useVirtualKeyboard) {
        this.virtualKeyboard.style.top = this.cursor.top() + pos.y + "px";
        this.virtualKeyboard.style.left = this.cursor.left() + pos.x + "px";
        this.virtualKeyboard.focus();
    }

    if (MorphicPreferences.useSliderForInput) {
        if (!aStringOrTextMorph.parentThatIsA(MenuMorph)) {
            this.slide(aStringOrTextMorph);
        }
    }

    if (this.lastEditedText !== aStringOrTextMorph) {
        aStringOrTextMorph.escalateEvent('freshTextEdit', aStringOrTextMorph);
    }
    this.lastEditedText = aStringOrTextMorph;
};

WorldMorph.prototype.slide = function (aStringOrTextMorph) {
    // display a slider for numeric text entries
    var val = parseFloat(aStringOrTextMorph.text),
        menu,
        slider;

    if (isNaN(val)) {
        val = 0;
    }
    menu = new MenuMorph();
    slider = new SliderMorph(
        val - 25,
        val + 25,
        val,
        10,
        'horizontal'
    );
    slider.alpha = 1;
    slider.color = new Color(225, 225, 225);
    slider.button.color = menu.borderColor;
    slider.button.highlightColor = slider.button.color.copy();
    slider.button.highlightColor.b += 100;
    slider.button.pressColor = slider.button.color.copy();
    slider.button.pressColor.b += 150;
    slider.silentSetHeight(MorphicPreferences.scrollBarSize);
    slider.silentSetWidth(MorphicPreferences.menuFontSize * 10);
    slider.drawNew();
    slider.action = function (num) {
        aStringOrTextMorph.changed();
        aStringOrTextMorph.text = Math.round(num).toString();
        aStringOrTextMorph.drawNew();
        aStringOrTextMorph.changed();
        aStringOrTextMorph.escalateEvent(
            'reactToSliderEdit',
            aStringOrTextMorph
        );
    };
    menu.items.push(slider);
    menu.popup(this, aStringOrTextMorph.bottomLeft().add(new Point(0, 5)));
};

WorldMorph.prototype.stopEditing = function () {
    if (this.cursor) {
        this.cursor.target.escalateEvent('reactToEdit', this.cursor.target);
        this.cursor.target.clearSelection();
        this.cursor.destroy();
        this.cursor = null;
    }
    if (this.keyboardReceiver && this.keyboardReceiver.stopEditing) {
        this.keyboardReceiver.stopEditing();
    }
    this.keyboardReceiver = null;
    if (this.virtualKeyboard) {
        this.virtualKeyboard.blur();
        document.body.removeChild(this.virtualKeyboard);
        this.virtualKeyboard = null;
    }
    this.lastEditedText = null;
    this.worldCanvas.focus();
};

WorldMorph.prototype.toggleBlurredShadows = function () {
    useBlurredShadows = !useBlurredShadows;
};

WorldMorph.prototype.togglePreferences = function () {
    if (MorphicPreferences === standardSettings) {
        MorphicPreferences = touchScreenSettings;
    } else {
        MorphicPreferences = standardSettings;
    }
};
