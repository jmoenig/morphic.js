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
