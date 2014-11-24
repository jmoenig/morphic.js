// PenMorph ////////////////////////////////////////////////////////////

// I am a simple LOGO-wise turtle.

// PenMorph: referenced constructors

var PenMorph;

// PenMorph inherits from Morph:

PenMorph.prototype = new Morph();
PenMorph.prototype.constructor = PenMorph;
PenMorph.uber = Morph.prototype;

// PenMorph instance creation:

function PenMorph() {
    this.init();
}

PenMorph.prototype.init = function () {
    var size = MorphicPreferences.handleSize * 4;

    // additional properties:
    this.isWarped = false; // internal optimization
    this.heading = 0;
    this.isDown = true;
    this.size = 1;
    this.wantsRedraw = false;
    this.penPoint = 'tip'; // or 'center"

    HandleMorph.uber.init.call(this);
    this.setExtent(new Point(size, size));
};

// PenMorph updating - optimized for warping, i.e atomic recursion

PenMorph.prototype.changed = function () {
    if (this.isWarped === false) {
        var w = this.root();
        if (w instanceof WorldMorph) {
            w.broken.push(this.visibleBounds().spread());
        }
        if (this.parent) {
            this.parent.childChanged(this);
        }
    }
};

// PenMorph display:

PenMorph.prototype.drawNew = function (facing) {
/*
    my orientation can be overridden with the "facing" parameter to
    implement Scratch-style rotation styles

*/
    var context, start, dest, left, right, len,
        direction = facing || this.heading;

    if (this.isWarped) {
        this.wantsRedraw = true;
        return;
    }
    this.image = newCanvas(this.extent());
    context = this.image.getContext('2d');
    len = this.width() / 2;
    start = this.center().subtract(this.bounds.origin);

    if (this.penPoint === 'tip') {
        dest = start.distanceAngle(len * 0.75, direction - 180);
        left = start.distanceAngle(len, direction + 195);
        right = start.distanceAngle(len, direction - 195);
    } else { // 'middle'
        dest = start.distanceAngle(len * 0.75, direction);
        left = start.distanceAngle(len * 0.33, direction + 230);
        right = start.distanceAngle(len * 0.33, direction - 230);
    }

    context.fillStyle = this.color.toString();
    context.beginPath();

    context.moveTo(start.x, start.y);
    context.lineTo(left.x, left.y);
    context.lineTo(dest.x, dest.y);
    context.lineTo(right.x, right.y);

    context.closePath();
    context.strokeStyle = 'white';
    context.lineWidth = 3;
    context.stroke();
    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.stroke();
    context.fill();

};

// PenMorph access:

PenMorph.prototype.setHeading = function (degrees) {
    this.heading = parseFloat(degrees) % 360;
    this.drawNew();
    this.changed();
};

// PenMorph drawing:

PenMorph.prototype.drawLine = function (start, dest) {
    var context = this.parent.penTrails().getContext('2d'),
        from = start.subtract(this.parent.bounds.origin),
        to = dest.subtract(this.parent.bounds.origin);
    if (this.isDown) {
        context.lineWidth = this.size;
        context.strokeStyle = this.color.toString();
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
        if (this.isWarped === false) {
            this.world().broken.push(
                start.rectangle(dest).expandBy(
                    Math.max(this.size / 2, 1)
                ).intersect(this.parent.visibleBounds()).spread()
            );
        }
    }
};

// PenMorph turtle ops:

PenMorph.prototype.turn = function (degrees) {
    this.setHeading(this.heading + parseFloat(degrees));
};

PenMorph.prototype.forward = function (steps) {
    var start = this.center(),
        dest,
        dist = parseFloat(steps);
    if (dist >= 0) {
        dest = this.position().distanceAngle(dist, this.heading);
    } else {
        dest = this.position().distanceAngle(
            Math.abs(dist),
            (this.heading - 180)
        );
    }
    this.setPosition(dest);
    this.drawLine(start, this.center());
};

PenMorph.prototype.down = function () {
    this.isDown = true;
};

PenMorph.prototype.up = function () {
    this.isDown = false;
};

PenMorph.prototype.clear = function () {
    this.parent.drawNew();
    this.parent.changed();
};

// PenMorph optimization for atomic recursion:

PenMorph.prototype.startWarp = function () {
    this.wantsRedraw = false;
    this.isWarped = true;
};

PenMorph.prototype.endWarp = function () {
    this.isWarped = false;
    if (this.wantsRedraw) {
        this.drawNew();
        this.wantsRedraw = false;
    }
    this.parent.changed();
};

PenMorph.prototype.warp = function (fun) {
    this.startWarp();
    fun.call(this);
    this.endWarp();
};

PenMorph.prototype.warpOp = function (selector, argsArray) {
    this.startWarp();
    this[selector].apply(this, argsArray);
    this.endWarp();
};

// PenMorph demo ops:
// try these with WARP eg.: this.warp(function () {tree(12, 120, 20)})

PenMorph.prototype.warpSierpinski = function (length, min) {
    this.warpOp('sierpinski', [length, min]);
};

PenMorph.prototype.sierpinski = function (length, min) {
    var i;
    if (length > min) {
        for (i = 0; i < 3; i += 1) {
            this.sierpinski(length * 0.5, min);
            this.turn(120);
            this.forward(length);
        }
    }
};

PenMorph.prototype.warpTree = function (level, length, angle) {
    this.warpOp('tree', [level, length, angle]);
};

PenMorph.prototype.tree = function (level, length, angle) {
    if (level > 0) {
        this.size = level;
        this.forward(length);
        this.turn(angle);
        this.tree(level - 1, length * 0.75, angle);
        this.turn(angle * -2);
        this.tree(level - 1, length * 0.75, angle);
        this.turn(angle);
        this.forward(-length);
    }
};
