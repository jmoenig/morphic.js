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
    if (noUpdate) {
        return;
    }
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
