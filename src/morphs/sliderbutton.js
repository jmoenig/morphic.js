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
